import "server-only";
import {
  APPOINTMENT_STATUSES,
  DOCUMENT_STATUSES,
  RENEWAL_FRACTION,
  STATUSES,
  type AppointmentStatus,
  type DocumentStatus,
  type RequestKind,
  type RequestStatus,
  type Solution,
  type WorkCategory,
} from "@/lib/domain";
import { getDocumentSlots } from "@/lib/document-requirements";
import { DOCUMENT_RULES } from "@/lib/documents";
import {
  AFTERNOON_TIMES,
  MORNING_TIMES,
  addDays,
  availableDays,
  closureReason,
  holidayName,
  isBookable,
  isGridSlot,
  mondayOf,
  romeDate,
  romeTime,
} from "@/lib/scheduling";
import type { BookingData, QuoteData } from "@/lib/schemas";
import { AuthorizationError, type Viewer } from "@/lib/server/auth";
import {
  acquireSlot,
  db,
  deleteClosure,
  findUserByEmail,
  insertClosure,
  occupiedSlots,
  releaseSlot,
  getUser,
  listConsultants,
  newId,
  nextReference,
  saveAppointment,
  saveRequest,
  saveUser,
  type Appointment,
  type Attachment,
  type Contract,
  type Prequal,
  type RequestRecord,
  type User,
} from "@/lib/server/store";
import { deleteObject } from "@/lib/server/storage";

/**
 * Accesso ai dati con regole di autorizzazione applicate lato server.
 * Ogni funzione che riceve un `viewer` verifica i permessi indipendentemente
 * da ciò che l'interfaccia mostra o nasconde.
 *
 *  - cliente: vede solo la propria pratica, senza note interne né storico interno.
 *  - consulente: vede le pratiche assegnate a sé e quelle non assegnate;
 *    modifica solo quelle assegnate a sé; può prendere in carico le non assegnate.
 *  - amministratore: vede e gestisce tutto, assegna a qualunque consulente.
 */

// ---------- Regole ----------

export function canRead(viewer: Viewer, r: RequestRecord) {
  if (viewer.role === "amministratore") return true;
  if (viewer.role === "consulente") return r.assigneeId === viewer.id || r.assigneeId === null;
  return r.clientUserId === viewer.id;
}

export function canManage(viewer: Viewer, r: RequestRecord) {
  if (viewer.role === "amministratore") return true;
  return viewer.role === "consulente" && r.assigneeId === viewer.id;
}

export function canAssign(viewer: Viewer, r: RequestRecord, targetId: string | null) {
  if (viewer.role === "amministratore") {
    return targetId === null || getUser(targetId)?.role === "consulente";
  }
  return viewer.role === "consulente" && r.assigneeId === null && targetId === viewer.id;
}

function findForStaff(viewer: Viewer, id: string) {
  if (viewer.role === "cliente") throw new AuthorizationError();
  const r = db.requests.find((x) => x.id === id);
  if (!r || !canRead(viewer, r)) throw new AuthorizationError("Pratica inesistente o non accessibile.");
  return r;
}

function touch(r: RequestRecord, actorId: string | null, summary: string) {
  const at = new Date().toISOString();
  r.updatedAt = at;
  r.history.unshift({ id: newId("h"), at, actorId, summary });
  saveRequest(r);
}

// ---------- Richieste dal sito pubblico ----------

function baseRecord(kind: RequestKind): RequestRecord {
  const now = new Date().toISOString();
  return {
    id: newId("r"),
    reference: nextReference(),
    kind,
    createdAt: now,
    updatedAt: now,
    status: "nuova",
    solution: null,
    workCategory: null,
    amount: null,
    durationMonths: null,
    contact: { fullName: "", email: "", phone: null, preference: null, timeSlot: null },
    message: "",
    booking: null,
    topic: null,
    privacyAckAt: now,
    marketingConsent: false,
    assigneeId: null,
    clientUserId: null,
    notes: [],
    history: [],
    documents: [],
    attachments: [],
    synthetic: false,
    prequal: null,
    channel: null,
    firstContactAt: null,
    agentInfoAckAt: null,
    contract: null,
    slaNotifiedAt: null,
    renewalNotifiedAt: null,
    renewalOfId: null,
  };
}

/** Il cliente accede con un link via email: il profilo nasce con la prima richiesta. */
function ensureClientUser(contact: { fullName: string; email: string; phone: string | null }, marketing: boolean) {
  const existing = findUserByEmail(contact.email, "cliente");
  if (existing) return existing;
  const user: User = {
    id: newId("u"),
    role: "cliente",
    name: contact.fullName,
    email: contact.email.trim().toLowerCase(),
    phone: contact.phone ?? undefined,
    active: true,
    preferences: { contact: "email", marketing, reminders: true },
  };
  db.users.push(user);
  saveUser(user);
  return user;
}

/** Consulente con meno pratiche aperte: usato se l'assegnazione automatica è attiva. */
function leastLoadedConsultant() {
  const load = (id: string) => db.requests.filter((r) => r.assigneeId === id && !CLOSED.includes(r.status)).length;
  return [...listConsultants()].sort((a, b) => load(a.id) - load(b.id))[0] ?? null;
}

function register(r: RequestRecord, summary: string) {
  r.history.push({ id: newId("h"), at: r.createdAt, actorId: null, summary });
  if (db.settings.autoAssign && !r.assigneeId) {
    const consultant = leastLoadedConsultant();
    if (consultant) {
      r.assigneeId = consultant.id;
      r.history.unshift({ id: newId("h"), at: r.createdAt, actorId: null, summary: `Assegnata automaticamente a ${consultant.name}` });
    }
  }
  db.requests.unshift(r);
  saveRequest(r);
  return r;
}

function buildPrequal(data: QuoteData): Prequal | null {
  const employee = data.workCategory === "dipendente-pubblico" || data.workCategory === "dipendente-privato";
  const value = (v: string | undefined, applicable = true) => (applicable && v ? v : null);
  const p: Prequal = {
    contractType: value(data.contractType, employee),
    seniority: value(data.seniority, employee),
    employerSize: value(data.employerSize, data.workCategory === "dipendente-privato"),
    incomeBand: value(data.incomeBand),
    existingLoans: value(data.existingLoans),
    ageBand: value(data.ageBand, data.workCategory === "pensionato"),
  };
  return Object.values(p).some(Boolean) ? p : null;
}

export function createQuoteRequest(data: QuoteData) {
  const r = baseRecord("preventivo");
  Object.assign(r, {
    solution: data.solution,
    workCategory: data.workCategory,
    amount: data.amount,
    durationMonths: data.durationMonths,
    contact: {
      fullName: `${data.firstName} ${data.lastName}`,
      email: data.email,
      phone: data.phone,
      preference: "email",
      timeSlot: null,
    },
    message: data.message ?? "",
    marketingConsent: data.marketingConsent === true,
    documents: getDocumentSlots(data.solution, data.workCategory).map((s) => ({
      id: s.id,
      label: s.label,
      description: s.hint,
      status: "da-caricare" as const,
    })),
    prequal: buildPrequal(data),
    channel: data.channel || null,
    agentInfoAckAt: data.agentInfoAck ? r.createdAt : null,
    clientUserId: ensureClientUser(
      { fullName: `${data.firstName} ${data.lastName}`, email: data.email, phone: data.phone },
      data.marketingConsent === true,
    ).id,
  });
  return register(r, "Richiesta di preventivo ricevuta dal sito");
}

/** Pratica raggiungibile dal link dell'email: non chiusa, con l'eventuale telefonata già in programma. */
export function getRequestForBooking(requestId: string) {
  const request = db.requests.find((r) => r.id === requestId);
  if (!request || CLOSED.includes(request.status)) return null;
  const now = new Date().toISOString();
  const appointment =
    db.appointments
      .filter((a) => a.requestId === requestId && a.startsAt > now && (a.status === "confermato" || a.status === "proposto"))
      .sort((a, b) => a.startsAt.localeCompare(b.startsAt))[0] ?? null;
  return { request, appointment };
}

export function bookCallFromLink(requestId: string, data: BookingData) {
  const found = getRequestForBooking(requestId);
  if (!found) throw new SlotUnavailableError("Questa pratica non accetta più prenotazioni.");
  if (found.appointment) throw new SlotUnavailableError("Hai già una telefonata fissata per questa richiesta.");
  const r = found.request;
  const requested = new Date(data.slot);
  const startsAt = Number.isNaN(requested.getTime()) ? "" : requested.toISOString();
  if (!isBookable(startsAt, Date.now(), db.closures)) throw new SlotUnavailableError("Questo orario non è prenotabile. Scegline un altro.");
  // Prima si occupa l'orario: se due persone inviano insieme, una sola ottiene lo slot.
  const appointmentId = newId("a");
  if (!acquireSlot(startsAt, appointmentId)) {
    throw new SlotUnavailableError("Questo orario è appena stato prenotato da un'altra persona. Scegline un altro.");
  }
  const appt: Appointment = {
    id: appointmentId,
    requestId: r.id,
    startsAt,
    mode: "telefono",
    status: "confermato",
    staffId: r.assigneeId,
    ...(data.notes ? { note: data.notes } : {}),
  };
  db.appointments.push(appt);
  saveAppointment(appt);
  r.contact.phone = data.phone;
  r.booking = { mode: "telefono", startsAt };
  touch(r, null, `Telefonata prenotata dal link nell'email per il ${formatDateTimeRome(startsAt)}`);
  return { request: r, appointment: appt };
}

/** Preventivo inviato: resta nella pratica come nota e chiude l'attesa del primo contatto. */
export function recordQuoteSent(viewer: Viewer, id: string, body: string) {
  const r = findForStaff(viewer, id);
  if (!canManage(viewer, r)) throw new AuthorizationError("Puoi modificare solo le pratiche assegnate a te.");
  const now = new Date().toISOString();
  if (r.status === "nuova") {
    r.status = "contattato";
    r.firstContactAt ??= now;
  }
  r.notes.unshift({ id: newId("n"), authorId: viewer.id, createdAt: now, body: `Preventivo inviato via email:\n\n${body}` });
  touch(r, viewer.id, "Preventivo inviato via email");
  return r;
}

// ---------- Disponibilità e planner ----------

/** Orario non più disponibile: il sito propone di sceglierne un altro. */
export class SlotUnavailableError extends Error {
  constructor(message = "Questo orario è già occupato. Scegline un altro.") {
    super(message);
    this.name = "SlotUnavailableError";
  }
}

function assertOpen(startsAt: string) {
  const reason = closureReason(romeDate(startsAt), romeTime(startsAt), db.closures);
  if (reason) throw new SlotUnavailableError(`Il calendario è chiuso in quell'orario: ${reason}.`);
}

const formatDateTimeRome = (iso: string) => `${romeDate(iso).split("-").reverse().join("/")} alle ${romeTime(iso)}`;

/** Solo giorni e orari liberi, nessun dato personale. */
export function getAvailability() {
  return availableDays(occupiedSlots(), Date.now(), db.closures);
}

/** Settimana del planner. Il calendario è unico: chi non può leggere la pratica vede solo "Occupato". */
export function getWeekPlanner(viewer: Viewer, anyDate: string) {
  if (viewer.role === "cliente") throw new AuthorizationError();
  const monday = mondayOf(anyDate);
  const days = [0, 1, 2, 3, 4].map((i) => addDays(monday, i));
  const appointments = db.appointments
    .filter((a) => a.status !== "annullato" && days.includes(romeDate(a.startsAt)))
    .map((a) => {
      const request = db.requests.find((r) => r.id === a.requestId) ?? null;
      const visible = Boolean(request && canRead(viewer, request));
      return {
        id: a.id,
        startsAt: a.startsAt,
        date: romeDate(a.startsAt),
        time: romeTime(a.startsAt),
        status: a.status,
        note: visible ? (a.note ?? null) : null,
        request: visible && request ? { id: request.id, name: request.contact.fullName, phone: request.contact.phone, reference: request.reference } : null,
        canManage: Boolean(request && canManage(viewer, request)),
      };
    });
  const closed = Object.fromEntries(
    days.flatMap((day) => [...MORNING_TIMES, ...AFTERNOON_TIMES].map((time) => [`${day} ${time}`, closureReason(day, time, db.closures)])),
  );
  // Telefonate già fissate che ora cadono in una chiusura: restano finché il team non le sposta.
  const now = new Date().toISOString();
  const conflicts = db.appointments
    .filter(
      (a) =>
        a.startsAt > now &&
        (a.status === "confermato" || a.status === "proposto") &&
        closureReason(romeDate(a.startsAt), romeTime(a.startsAt), db.closures),
    )
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt))
    .map((a) => {
      const request = db.requests.find((r) => r.id === a.requestId);
      return { id: a.id, startsAt: a.startsAt, name: request && canRead(viewer, request) ? request.contact.fullName : null };
    });
  return {
    monday,
    days,
    morning: MORNING_TIMES,
    afternoon: AFTERNOON_TIMES,
    appointments,
    closed,
    holidays: Object.fromEntries(days.map((d) => [d, holidayName(d)])),
    conflicts,
  };
}

/** Chiusure ancora attive o future, visibili a tutto il team. */
export function listClosures(viewer: Viewer) {
  if (viewer.role === "cliente") throw new AuthorizationError();
  const today = romeDate(new Date());
  return db.closures.filter((c) => c.dateTo >= today).sort((a, b) => a.dateFrom.localeCompare(b.dateFrom));
}

/** Il calendario è unico per tutti: le chiusure le gestisce l'amministratore. */
export function addClosure(
  viewer: Viewer,
  input: { dateFrom: string; dateTo: string; timeFrom: string | null; timeTo: string | null; reason: string },
) {
  if (viewer.role !== "amministratore") throw new AuthorizationError("Solo un amministratore può chiudere il calendario.");
  if (input.dateFrom > input.dateTo) throw new SlotUnavailableError("Il giorno di fine deve venire dopo quello di inizio.");
  if ((input.timeFrom === null) !== (input.timeTo === null)) throw new SlotUnavailableError("Indica sia l'ora di inizio sia quella di fine, oppure nessuna.");
  if (input.timeFrom && input.timeTo && input.timeFrom >= input.timeTo) throw new SlotUnavailableError("L'ora di fine deve venire dopo quella di inizio.");
  insertClosure({ ...input, id: newId("c"), createdBy: viewer.id, createdAt: new Date().toISOString() });
}

export function removeClosure(viewer: Viewer, id: string) {
  if (viewer.role !== "amministratore") throw new AuthorizationError("Solo un amministratore può riaprire il calendario.");
  deleteClosure(id);
}

// ---------- Documenti allegati ----------

export type AttachmentInput = Omit<Attachment, "id" | "uploadedAt" | "uploadedBy" | "documentId">;

/** Verifica preliminare (prima di scrivere il file): richiesta, documento e limiti. */
function checkAttachable(r: RequestRecord, documentId: string) {
  const doc = r.documents.find((d) => d.id === documentId);
  if (!doc) throw new Error("Documento non previsto per questa richiesta.");
  if (r.attachments.length >= DOCUMENT_RULES.maxFilesPerRequest) throw new Error("Hai raggiunto il numero massimo di file.");
  if (r.attachments.filter((a) => a.documentId === documentId).length >= DOCUMENT_RULES.maxFilesPerSlot) {
    throw new Error(`Puoi caricare al massimo ${DOCUMENT_RULES.maxFilesPerSlot} file per questo documento.`);
  }
  return doc;
}

function attach(r: RequestRecord, documentId: string, input: AttachmentInput, by: Attachment["uploadedBy"], actorId: string | null) {
  const doc = checkAttachable(r, documentId);
  const att: Attachment = { ...input, id: newId("f"), documentId, uploadedAt: new Date().toISOString(), uploadedBy: by };
  r.attachments.push(att);
  if (doc.status === "da-caricare" || doc.status === "da-integrare") doc.status = "ricevuto";
  touch(r, actorId, `Documento caricato (${doc.label}): ${input.originalName}`);
  return att;
}

/** Richiesta raggiungibile con token di caricamento del sito pubblico (non c'è un utente). */
export function getRequestForUpload(requestId: string, documentId: string) {
  const r = db.requests.find((x) => x.id === requestId && x.kind === "preventivo");
  if (!r) throw new AuthorizationError("Richiesta non trovata.");
  if (!r.agentInfoAckAt) throw new Error("Per allegare i documenti serve la presa visione dell'informativa sull'intermediario.");
  checkAttachable(r, documentId);
  return r;
}

export function attachFromSite(requestId: string, documentId: string, input: AttachmentInput) {
  const r = getRequestForUpload(requestId, documentId);
  return attach(r, documentId, input, "sito", null);
}

export function getClientRequestForUpload(viewer: Viewer, documentId: string) {
  if (viewer.role !== "cliente") throw new AuthorizationError();
  const r = db.requests.find((x) => x.clientUserId === viewer.id);
  if (!r) throw new AuthorizationError("Nessuna pratica collegata al profilo.");
  checkAttachable(r, documentId);
  return r;
}

export function attachForClient(viewer: Viewer, documentId: string, input: AttachmentInput) {
  const r = getClientRequestForUpload(viewer, documentId);
  return attach(r, documentId, input, "cliente", viewer.id);
}

/** Accesso a un allegato: il cliente solo ai propri, il personale secondo `canRead`. */
export function getAttachmentForViewer(viewer: Viewer, attachmentId: string) {
  for (const r of db.requests) {
    const att = r.attachments.find((a) => a.id === attachmentId);
    if (!att) continue;
    if (!canRead(viewer, r)) throw new AuthorizationError();
    return att;
  }
  throw new AuthorizationError("Documento non trovato.");
}

/** Eliminazione di un allegato (solo amministratori): es. richiesta dell'interessato. */
export async function deleteAttachment(viewer: Viewer, attachmentId: string) {
  if (viewer.role !== "amministratore") throw new AuthorizationError();
  const r = db.requests.find((x) => x.attachments.some((a) => a.id === attachmentId));
  const att = r?.attachments.find((a) => a.id === attachmentId);
  if (!r || !att) throw new Error("Documento non trovato.");
  await deleteObject(att.storageKey);
  r.attachments = r.attachments.filter((a) => a.id !== attachmentId);
  const doc = r.documents.find((d) => d.id === att.documentId);
  if (doc && !r.attachments.some((a) => a.documentId === doc.id)) doc.status = "da-caricare";
  touch(r, viewer.id, `Documento eliminato: ${att.originalName}`);
  return r;
}

// ---------- Spazio team ----------

export type RequestFilters = {
  q?: string;
  status?: RequestStatus | "aperte" | "";
  kind?: RequestKind | "";
  solution?: Solution | "";
  owner?: "mie" | "non-assegnate" | "";
};

const CLOSED: RequestStatus[] = ["conclusa", "non-proseguita"];

export function listRequests(viewer: Viewer, filters: RequestFilters = {}) {
  if (viewer.role === "cliente") throw new AuthorizationError();
  const q = filters.q?.trim().toLowerCase();
  return db.requests
    .filter((r) => canRead(viewer, r))
    .filter((r) => {
      if (filters.status === "aperte" && CLOSED.includes(r.status)) return false;
      if (filters.status && filters.status !== "aperte" && r.status !== filters.status) return false;
      if (filters.kind && r.kind !== filters.kind) return false;
      if (filters.solution && r.solution !== filters.solution) return false;
      if (filters.owner === "mie" && r.assigneeId !== viewer.id) return false;
      if (filters.owner === "non-assegnate" && r.assigneeId !== null) return false;
      if (q) {
        const hay = [r.reference, r.contact.fullName, r.contact.email, r.contact.phone ?? ""].join(" ").toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    })
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function getRequestForStaff(viewer: Viewer, id: string) {
  const r = findForStaff(viewer, id);
  return {
    request: r,
    appointments: db.appointments.filter((a) => a.requestId === r.id).sort((a, b) => b.startsAt.localeCompare(a.startsAt)),
    permissions: {
      manage: canManage(viewer, r),
      assignAny: viewer.role === "amministratore",
      takeOver: viewer.role === "consulente" && r.assigneeId === null,
    },
  };
}

export function updateStatus(viewer: Viewer, id: string, status: RequestStatus) {
  const r = findForStaff(viewer, id);
  if (!canManage(viewer, r)) throw new AuthorizationError("Puoi modificare solo le pratiche assegnate a te.");
  if (!Object.hasOwn(STATUSES, status)) throw new Error("Stato non valido.");
  if (r.status === status) return r;
  const from = STATUSES[r.status].label;
  if (r.status === "nuova" && !r.firstContactAt) r.firstContactAt = new Date().toISOString();
  r.status = status;
  touch(r, viewer.id, `Stato: ${from} → ${STATUSES[status].label}`);
  return r;
}

export function assignRequest(viewer: Viewer, id: string, assigneeId: string | null) {
  const r = findForStaff(viewer, id);
  if (!canAssign(viewer, r, assigneeId)) throw new AuthorizationError("Assegnazione non consentita.");
  r.assigneeId = assigneeId;
  const name = assigneeId ? getUser(assigneeId)?.name : null;
  touch(
    r,
    viewer.id,
    assigneeId === viewer.id && viewer.role === "consulente"
      ? `Presa in carico da ${name}`
      : name
        ? `Assegnata a ${name}`
        : "Assegnazione rimossa",
  );
  return r;
}

export function addNote(viewer: Viewer, id: string, body: string) {
  const r = findForStaff(viewer, id);
  if (!canManage(viewer, r)) throw new AuthorizationError("Puoi annotare solo le pratiche assegnate a te.");
  const text = body.trim();
  if (text.length < 2 || text.length > 2000) throw new Error("La nota deve contenere tra 2 e 2.000 caratteri.");
  r.notes.unshift({ id: newId("n"), authorId: viewer.id, createdAt: new Date().toISOString(), body: text });
  touch(r, viewer.id, "Aggiunta una nota interna");
  return r;
}

export function updateDocumentStatus(viewer: Viewer, id: string, docId: string, status: DocumentStatus) {
  const r = findForStaff(viewer, id);
  if (!canManage(viewer, r)) throw new AuthorizationError();
  if (!(status in DOCUMENT_STATUSES)) throw new Error("Stato documento non valido.");
  const doc = r.documents.find((d) => d.id === docId);
  if (!doc) throw new Error("Documento non trovato.");
  doc.status = status;
  touch(r, viewer.id, `Documento «${doc.label}»: ${DOCUMENT_STATUSES[status]}`);
  return r;
}

/** Aggiunge un documento all'elenco richiesto (visibile e caricabile dal cliente). */
export function addDocumentRequirement(viewer: Viewer, id: string, label: string, description: string) {
  const r = findForStaff(viewer, id);
  if (!canManage(viewer, r)) throw new AuthorizationError();
  const clean = label.trim();
  if (clean.length < 3 || clean.length > 80) throw new Error("Il nome del documento deve avere tra 3 e 80 caratteri.");
  if (r.documents.length >= 20) throw new Error("Numero massimo di documenti raggiunto.");
  const docId = `extra-${newId("d").slice(2)}`;
  r.documents.push({ id: docId, label: clean, description: description.trim().slice(0, 160), status: "da-caricare" });
  touch(r, viewer.id, `Richiesto un nuovo documento: ${clean}`);
  return r;
}

export function createAppointment(
  viewer: Viewer,
  id: string,
  input: { startsAt: string; note?: string },
) {
  const r = findForStaff(viewer, id);
  if (!canManage(viewer, r)) throw new AuthorizationError("Puoi fissare appuntamenti solo sulle pratiche assegnate a te.");
  const when = new Date(input.startsAt);
  const startsAt = Number.isNaN(when.getTime()) ? "" : when.toISOString();
  if (!isGridSlot(startsAt) || when.getTime() <= Date.now()) throw new SlotUnavailableError("Scegli un orario futuro tra quelli del calendario.");
  assertOpen(startsAt);
  const appt: Appointment = {
    id: newId("a"),
    requestId: r.id,
    startsAt,
    mode: "telefono",
    status: "confermato",
    staffId: r.assigneeId ?? viewer.id,
    note: input.note?.trim() || undefined,
  };
  if (!acquireSlot(startsAt, appt.id)) throw new SlotUnavailableError();
  db.appointments.push(appt);
  saveAppointment(appt);
  touch(r, viewer.id, `Telefonata fissata per il ${formatDateTimeRome(startsAt)}`);
  return { request: r, appointment: appt };
}

export function updateAppointmentStatus(viewer: Viewer, apptId: string, status: AppointmentStatus) {
  const appt = db.appointments.find((a) => a.id === apptId);
  if (!appt) throw new Error("Appuntamento non trovato.");
  const r = findForStaff(viewer, appt.requestId);
  if (!canManage(viewer, r)) throw new AuthorizationError();
  if (!Object.hasOwn(APPOINTMENT_STATUSES, status)) throw new Error("Stato non valido.");
  const wasCancelled = appt.status === "annullato";
  // Annullando si libera l'orario; riattivando serve che sia ancora libero.
  if (status === "annullato" && !wasCancelled) releaseSlot(appt.startsAt, appt.id);
  if (status !== "annullato" && wasCancelled && !acquireSlot(appt.startsAt, appt.id)) throw new SlotUnavailableError();
  appt.status = status;
  saveAppointment(appt);
  touch(r, viewer.id, `Appuntamento: ${APPOINTMENT_STATUSES[status]}`);
  return {
    request: r,
    appointment: appt,
    cancelled: status === "annullato" && !wasCancelled,
    reactivated: status !== "annullato" && wasCancelled,
  };
}

/** Sposta una telefonata: il nuovo orario si occupa prima di liberare il vecchio. */
export function moveAppointment(viewer: Viewer, apptId: string, newStartsAt: string) {
  const appt = db.appointments.find((a) => a.id === apptId);
  if (!appt) throw new Error("Appuntamento non trovato.");
  const r = findForStaff(viewer, appt.requestId);
  if (!canManage(viewer, r)) throw new AuthorizationError("Puoi spostare solo gli appuntamenti delle pratiche assegnate a te.");
  if (appt.status === "annullato") throw new Error("L'appuntamento è annullato.");
  const when = new Date(newStartsAt);
  const startsAt = Number.isNaN(when.getTime()) ? "" : when.toISOString();
  if (!isGridSlot(startsAt) || when.getTime() <= Date.now()) throw new SlotUnavailableError("Scegli un orario futuro tra quelli del calendario.");
  assertOpen(startsAt);
  if (startsAt === appt.startsAt) return { request: r, appointment: appt, moved: false };
  if (!acquireSlot(startsAt, appt.id)) throw new SlotUnavailableError();
  releaseSlot(appt.startsAt, appt.id);
  appt.startsAt = startsAt;
  appt.status = "confermato";
  saveAppointment(appt);
  if (r.booking) r.booking = { ...r.booking, startsAt };
  touch(r, viewer.id, `Telefonata spostata al ${formatDateTimeRome(startsAt)}`);
  return { request: r, appointment: appt, moved: true };
}

export function listAppointmentsForStaff(viewer: Viewer) {
  if (viewer.role === "cliente") throw new AuthorizationError();
  return db.appointments
    .map((a) => ({ appt: a, request: db.requests.find((r) => r.id === a.requestId)! }))
    .filter(({ appt, request }) => request && canRead(viewer, request) && (viewer.role === "amministratore" || appt.staffId === viewer.id || appt.staffId === null))
    .sort((a, b) => a.appt.startsAt.localeCompare(b.appt.startsAt));
}

export function getPanelStats(viewer: Viewer) {
  const visible = listRequests(viewer);
  return {
    open: visible.filter((r) => !CLOSED.includes(r.status)).length,
    unassigned: visible.filter((r) => r.assigneeId === null).length,
    mine: visible.filter((r) => r.assigneeId === viewer.id && !CLOSED.includes(r.status)).length,
    newToday: visible.filter((r) => new Date(r.createdAt).toDateString() === new Date().toDateString()).length,
  };
}

// ---------- Finanziamenti erogati e rinnovi ----------

const addMonths = (iso: string, months: number) => {
  const d = new Date(iso);
  d.setMonth(d.getMonth() + months);
  return d.toISOString();
};

/** Data stimata di rinnovabilità: da confermare con il mandante caso per caso. */
export function renewableAt(contract: Contract) {
  return addMonths(contract.disbursedAt, Math.ceil(contract.durationMonths * RENEWAL_FRACTION));
}

export function recordContract(
  viewer: Viewer,
  id: string,
  input: { disbursedAt: string; amount: number; durationMonths: number; lender: string; installment: number | null },
) {
  const r = findForStaff(viewer, id);
  if (!canManage(viewer, r)) throw new AuthorizationError();
  const when = new Date(input.disbursedAt);
  if (Number.isNaN(when.getTime())) throw new Error("Data di erogazione non valida.");
  r.contract = { ...input, disbursedAt: when.toISOString(), renewalContactedAt: r.contract?.renewalContactedAt ?? null };
  r.status = "conclusa";
  touch(r, viewer.id, "Registrato il finanziamento erogato");
  return r;
}

const RENEWABLE_SOLUTIONS: (Solution | null)[] = ["cessione-quinto", "prestito-delega", "consiglio"];

export function listRenewals(viewer: Viewer) {
  if (viewer.role === "cliente") throw new AuthorizationError();
  const now = Date.now();
  return db.requests
    .filter((r) => r.contract && RENEWABLE_SOLUTIONS.includes(r.solution) && canRead(viewer, r))
    .map((r) => {
      const at = renewableAt(r.contract!);
      const days = Math.ceil((new Date(at).getTime() - now) / 86_400_000);
      const endsAt = addMonths(r.contract!.disbursedAt, r.contract!.durationMonths);
      return { request: r, renewableAt: at, endsAt, daysToRenewal: days, renewed: db.requests.some((x) => x.renewalOfId === r.id) };
    })
    .sort((a, b) => a.renewableAt.localeCompare(b.renewableAt));
}

export function markRenewalContacted(viewer: Viewer, id: string) {
  const r = findForStaff(viewer, id);
  if (!canManage(viewer, r) || !r.contract) throw new AuthorizationError();
  r.contract.renewalContactedAt = new Date().toISOString();
  touch(r, viewer.id, "Cliente contattato per il rinnovo");
  return r;
}

/** Apre una nuova pratica di rinnovo con i dati della precedente. */
export function createRenewalRequest(viewer: Viewer, id: string) {
  const source = findForStaff(viewer, id);
  if (!canManage(viewer, source) || !source.contract) throw new AuthorizationError();
  const existing = db.requests.find((r) => r.renewalOfId === source.id);
  if (existing) return existing;
  const r = baseRecord("preventivo");
  Object.assign(r, {
    solution: source.solution,
    workCategory: source.workCategory as WorkCategory | null,
    durationMonths: source.contract.durationMonths,
    amount: source.contract.amount,
    contact: { ...source.contact },
    marketingConsent: source.marketingConsent,
    assigneeId: source.assigneeId ?? (viewer.role === "consulente" ? viewer.id : null),
    clientUserId: source.clientUserId,
    channel: source.channel,
    renewalOfId: source.id,
    synthetic: source.synthetic,
    documents: getDocumentSlots(source.solution, source.workCategory).map((s) => ({
      id: s.id,
      label: s.label,
      description: s.hint,
      status: "da-caricare" as const,
    })),
  });
  r.history.push({ id: newId("h"), at: r.createdAt, actorId: viewer.id, summary: `Pratica di rinnovo aperta da ${source.reference}` });
  db.requests.unshift(r);
  saveRequest(r);
  touch(source, viewer.id, `Aperta la pratica di rinnovo ${r.reference}`);
  return r;
}

// ---------- Personale ----------

export function createStaffUser(viewer: Viewer, input: { name: string; email: string; role: "consulente" | "amministratore" }) {
  if (viewer.role !== "amministratore") throw new AuthorizationError();
  if (findUserByEmail(input.email, "team")) throw new Error("Esiste già un account con questa email.");
  const user: User = { id: newId("u"), role: input.role, name: input.name, email: input.email.trim().toLowerCase(), active: true };
  db.users.push(user);
  saveUser(user);
  return user;
}

export function setStaffActive(viewer: Viewer, userId: string, active: boolean) {
  if (viewer.role !== "amministratore") throw new AuthorizationError();
  if (userId === viewer.id) throw new Error("Non puoi disattivare il tuo stesso account.");
  const user = getUser(userId);
  if (!user || user.role === "cliente") throw new Error("Utente non trovato.");
  user.active = active;
  saveUser(user);
  return user;
}

// ---------- Area cliente ----------

/** Vista cliente: esclude note interne, storico operativo e dati di altri. */
export function getClientOverview(viewer: Viewer) {
  if (viewer.role !== "cliente") throw new AuthorizationError();
  const r = db.requests.find((x) => x.clientUserId === viewer.id);
  if (!r) return null;
  const advisor = r.assigneeId ? getUser(r.assigneeId) : null;
  return {
    id: r.id,
    reference: r.reference,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
    status: r.status,
    solution: r.solution,
    amount: r.amount,
    durationMonths: r.durationMonths,
    documents: r.documents.map((d) => ({
      ...d,
      files: r.attachments
        .filter((a) => a.documentId === d.id)
        .map((a) => ({ id: a.id, name: a.originalName, size: a.size, uploadedAt: a.uploadedAt })),
    })),
    advisor: advisor ? { name: advisor.name, email: advisor.email, phone: advisor.phone ?? null } : null,
    appointments: db.appointments
      .filter((a) => a.requestId === r.id && a.status !== "annullato")
      .map((a) => ({ id: a.id, startsAt: a.startsAt, mode: a.mode, status: a.status, note: a.note ?? null }))
      .sort((a, b) => a.startsAt.localeCompare(b.startsAt)),
  };
}

export function updateClientPreferences(
  viewer: Viewer,
  prefs: { contact: "telefono" | "email"; marketing: boolean; reminders: boolean },
) {
  if (viewer.role !== "cliente") throw new AuthorizationError();
  const user = getUser(viewer.id);
  if (!user) throw new AuthorizationError();
  user.preferences = prefs;
  saveUser(user);
  const r = db.requests.find((x) => x.clientUserId === viewer.id);
  if (r) {
    r.marketingConsent = prefs.marketing;
    touch(r, viewer.id, "Il cliente ha aggiornato le preferenze di contatto");
  }
  return user;
}
