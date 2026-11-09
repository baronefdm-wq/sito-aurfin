"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { emailAppointmentChanged, emailDocumentRequested, emailQuoteReply, emailStatusChanged } from "@/lib/server/client-emails";
import { QUOTE_PLACEHOLDER } from "@/lib/quote-reply";
import { runMaintenance } from "@/lib/server/jobs";
import { isDeliverable, isMailReady, notifyStaff, sendAccessEmail, syncAppointmentToCalendar, teamUrl } from "@/lib/server/notifications";
import { saveSettings } from "@/lib/server/store";
import { createToken } from "@/lib/server/tokens";
import { proposalEvent } from "@/lib/server/notify-events";
import { z } from "zod";
import { APPOINTMENT_STATUSES, DOCUMENT_STATUSES, STATUS_KEYS } from "@/lib/domain";
import { romeToIso } from "@/lib/scheduling";
import { STAFF_ROLES, assertRole } from "@/lib/server/auth";
import * as repo from "@/lib/server/repository";

/**
 * Server action dello spazio team. Ogni azione:
 *  1. verifica la sessione e il ruolo (assertRole);
 *  2. valida l'input con Zod;
 *  3. delega al repository, che applica i permessi sulla singola pratica.
 */

const id = z.string().min(1).max(64);

export async function changeStatus(formData: FormData) {
  const viewer = await assertRole(STAFF_ROLES);
  const input = z.object({ id, status: z.enum(STATUS_KEYS) }).parse(Object.fromEntries(formData));
  const before = repo.getRequestForStaff(viewer, input.id).request.status;
  const r = repo.updateStatus(viewer, input.id, input.status);
  if (input.status === "proposta" && before !== "proposta") after(() => notifyStaff(proposalEvent(r)));
  if (before !== input.status) after(() => emailStatusChanged(r));
  revalidatePath(`/team/pratiche/${input.id}`);
  revalidatePath("/team");
}

export async function assign(formData: FormData) {
  const viewer = await assertRole(STAFF_ROLES);
  const input = z.object({ id, assigneeId: z.string().max(64) }).parse(Object.fromEntries(formData));
  repo.assignRequest(viewer, input.id, input.assigneeId === "" ? null : input.assigneeId);
  revalidatePath(`/team/pratiche/${input.id}`);
  revalidatePath("/team");
}

export async function takeOver(formData: FormData) {
  const viewer = await assertRole(["consulente"]);
  const input = z.object({ id }).parse(Object.fromEntries(formData));
  repo.assignRequest(viewer, input.id, viewer.id);
  revalidatePath(`/team/pratiche/${input.id}`);
  revalidatePath("/team");
}

export async function addNote(formData: FormData) {
  const viewer = await assertRole(STAFF_ROLES);
  const input = z.object({ id, body: z.string().trim().min(2).max(2000) }).parse(Object.fromEntries(formData));
  repo.addNote(viewer, input.id, input.body);
  revalidatePath(`/team/pratiche/${input.id}`);
}

export type QuoteReplyState = { ok: boolean; message: string } | null;

/** Invia il preventivo scritto dal consulente, con il link personale per prenotare la telefonata. */
export async function sendQuoteReply(_previous: QuoteReplyState, formData: FormData): Promise<QuoteReplyState> {
  const viewer = await assertRole(STAFF_ROLES);
  const input = z.object({ id, body: z.string().trim().min(20).max(6000) }).safeParse(Object.fromEntries(formData));
  if (!input.success) return { ok: false, message: "Scrivi il testo del preventivo prima di inviarlo." };
  const { id: requestId, body } = input.data;
  if (body.includes(QUOTE_PLACEHOLDER)) return { ok: false, message: "Sostituisci la riga tra parentesi quadre con il preventivo." };
  const { request: r, permissions } = repo.getRequestForStaff(viewer, requestId);
  if (!permissions.manage) return { ok: false, message: "Puoi inviare il preventivo solo per le pratiche assegnate a te." };
  if (!repo.getRequestForBooking(r.id)) return { ok: false, message: "La pratica è chiusa." };
  const failure = await emailQuoteReply(r, body);
  if (failure) return { ok: false, message: `Email non inviata: ${failure}` };
  repo.recordQuoteSent(viewer, requestId, body);
  revalidatePath(`/team/pratiche/${requestId}`);
  revalidatePath("/team");
  return { ok: true, message: `Preventivo inviato a ${r.contact.email}.` };
}

const slotDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const slotTime = z.string().regex(/^\d{2}:\d{2}$/);
/** Torna alla pagina di provenienza (solo percorsi del team) con un eventuale messaggio di errore. */
const backTo = (raw: FormDataEntryValue | null, fallback: string) => {
  const target = String(raw ?? "");
  return /^\/team(\/[\w\-/?=&%.]*)?$/.test(target) ? target : fallback;
};
const withError = (target: string, message: string) =>
  `${target}${target.includes("?") ? "&" : "?"}errore=${encodeURIComponent(message)}`;

export async function scheduleAppointment(formData: FormData) {
  const viewer = await assertRole(STAFF_ROLES);
  const input = z.object({ id, date: slotDate, time: slotTime, note: z.string().trim().max(300).optional() }).parse(Object.fromEntries(formData));
  const page = `/team/pratiche/${input.id}`;
  let failure: string | null = null;
  try {
    const { request, appointment } = repo.createAppointment(viewer, input.id, { startsAt: romeToIso(input.date, input.time), note: input.note });
    after(() => emailAppointmentChanged(request, appointment.startsAt, "fissata"));
    after(() => syncAppointmentToCalendar(request, appointment, "aggiorna"));
  } catch (e) {
    if (!(e instanceof repo.SlotUnavailableError)) throw e;
    failure = e.message;
  }
  if (failure) redirect(withError(page, failure));
  revalidatePath(page);
  revalidatePath("/team/planner");
  revalidatePath("/team/appuntamenti");
}

export async function setAppointmentStatus(formData: FormData) {
  const viewer = await assertRole(STAFF_ROLES);
  const input = z
    .object({ id, apptId: id, status: z.enum(Object.keys(APPOINTMENT_STATUSES) as [keyof typeof APPOINTMENT_STATUSES]) })
    .parse(Object.fromEntries(formData));
  const page = backTo(formData.get("back"), `/team/pratiche/${input.id}`);
  let failure: string | null = null;
  try {
    const { request, appointment, cancelled, reactivated } = repo.updateAppointmentStatus(viewer, input.apptId, input.status);
    if (cancelled) {
      after(() => emailAppointmentChanged(request, appointment.startsAt, "annullata"));
      after(() => syncAppointmentToCalendar(request, appointment, "annulla"));
    } else if (reactivated) {
      after(() => syncAppointmentToCalendar(request, appointment, "aggiorna"));
    }
  } catch (e) {
    if (!(e instanceof repo.SlotUnavailableError)) throw e;
    failure = e.message;
  }
  if (failure) redirect(withError(page, failure));
  revalidatePath(`/team/pratiche/${input.id}`);
  revalidatePath("/team/planner");
  revalidatePath("/team/appuntamenti");
}

export async function moveAppointment(formData: FormData) {
  const viewer = await assertRole(STAFF_ROLES);
  const input = z.object({ apptId: id, date: slotDate, time: slotTime }).parse(Object.fromEntries(formData));
  const startsAt = romeToIso(input.date, input.time);
  let failure: string | null = null;
  try {
    const { request, appointment, moved } = repo.moveAppointment(viewer, input.apptId, startsAt);
    if (moved) {
      after(() => emailAppointmentChanged(request, appointment.startsAt, "spostata"));
      after(() => syncAppointmentToCalendar(request, appointment, "aggiorna"));
    }
    revalidatePath(`/team/pratiche/${request.id}`);
  } catch (e) {
    if (!(e instanceof repo.SlotUnavailableError)) throw e;
    failure = e.message;
  }
  const page = `/team/planner?settimana=${input.date}`;
  if (failure) redirect(withError(`${page}&appuntamento=${input.apptId}`, failure));
  revalidatePath("/team/planner");
  revalidatePath("/team/appuntamenti");
  redirect(page);
}

export async function addClosure(formData: FormData) {
  const viewer = await assertRole(["amministratore"]);
  const input = z
    .object({
      dateFrom: slotDate,
      dateTo: slotDate,
      timeFrom: z.union([z.literal(""), slotTime]),
      timeTo: z.union([z.literal(""), slotTime]),
      reason: z.string().trim().min(2).max(80),
    })
    .parse(Object.fromEntries(formData));
  const page = `/team/planner?settimana=${input.dateFrom}`;
  let failure: string | null = null;
  try {
    repo.addClosure(viewer, { ...input, timeFrom: input.timeFrom || null, timeTo: input.timeTo || null });
  } catch (e) {
    if (!(e instanceof repo.SlotUnavailableError)) throw e;
    failure = e.message;
  }
  if (failure) redirect(withError(page, failure));
  revalidatePath("/team/planner");
  redirect(page);
}

export async function removeClosure(formData: FormData) {
  const viewer = await assertRole(["amministratore"]);
  const input = z.object({ closureId: id }).parse(Object.fromEntries(formData));
  repo.removeClosure(viewer, input.closureId);
  revalidatePath("/team/planner");
}

export async function requestDocument(formData: FormData) {
  const viewer = await assertRole(STAFF_ROLES);
  const input = z
    .object({ id, label: z.string().trim().min(3).max(80), description: z.string().trim().max(160).optional().default("") })
    .parse(Object.fromEntries(formData));
  const r = repo.addDocumentRequirement(viewer, input.id, input.label, input.description);
  if (r.clientUserId) after(() => emailDocumentRequested(r, input.label));
  revalidatePath(`/team/pratiche/${input.id}`);
}

/** Invio di prova sui canali configurati (solo amministratori). */
export async function sendTestNotification() {
  const viewer = await assertRole(["amministratore"]);
  await notifyStaff({
    type: "prova",
    title: "Notifica di prova",
    reference: null,
    requestId: null,
    lines: [`Invio di prova richiesto da ${viewer.name}.`, "Se ricevi questo messaggio, il canale è configurato correttamente."],
  });
  revalidatePath("/team/notifiche");
}

export async function setDocumentStatus(formData: FormData) {
  const viewer = await assertRole(STAFF_ROLES);
  const input = z
    .object({ id, docId: id, status: z.enum(Object.keys(DOCUMENT_STATUSES) as [keyof typeof DOCUMENT_STATUSES]) })
    .parse(Object.fromEntries(formData));
  repo.updateDocumentStatus(viewer, input.id, input.docId, input.status);
  revalidatePath(`/team/pratiche/${input.id}`);
}

export async function removeAttachment(formData: FormData) {
  const viewer = await assertRole(["amministratore"]);
  const input = z.object({ id, attachmentId: id }).parse(Object.fromEntries(formData));
  await repo.deleteAttachment(viewer, input.attachmentId);
  revalidatePath(`/team/pratiche/${input.id}`);
}

// ---------- Finanziamenti erogati e rinnovi ----------

export async function saveContract(formData: FormData) {
  const viewer = await assertRole(STAFF_ROLES);
  const input = z
    .object({
      id,
      disbursedAt: z.string().min(8).max(30),
      amount: z.coerce.number().positive().max(10_000_000),
      durationMonths: z.coerce.number().int().min(1).max(360),
      lender: z.string().trim().min(2).max(120),
      installment: z.union([z.literal(""), z.coerce.number().positive().max(100_000)]).optional(),
    })
    .parse(Object.fromEntries(formData));
  const wasClosed = repo.getRequestForStaff(viewer, input.id).request.status === "conclusa";
  const r = repo.recordContract(viewer, input.id, {
    disbursedAt: input.disbursedAt,
    amount: input.amount,
    durationMonths: input.durationMonths,
    lender: input.lender,
    installment: typeof input.installment === "number" ? input.installment : null,
  });
  if (!wasClosed) after(() => emailStatusChanged(r));
  revalidatePath(`/team/pratiche/${input.id}`);
  revalidatePath("/team/rinnovi");
}

export async function renewalContacted(formData: FormData) {
  const viewer = await assertRole(STAFF_ROLES);
  const input = z.object({ id }).parse(Object.fromEntries(formData));
  repo.markRenewalContacted(viewer, input.id);
  revalidatePath("/team/rinnovi");
}

export async function openRenewal(formData: FormData) {
  const viewer = await assertRole(STAFF_ROLES);
  const input = z.object({ id }).parse(Object.fromEntries(formData));
  const r = repo.createRenewalRequest(viewer, input.id);
  redirect(`/team/pratiche/${r.id}`);
}

// ---------- Impostazioni e utenti (solo amministratori) ----------

export async function updateSettings(formData: FormData) {
  await assertRole(["amministratore"]);
  saveSettings({ autoAssign: formData.get("autoAssign") === "on", clientEmails: formData.get("clientEmails") === "on" });
  revalidatePath("/team/notifiche");
  revalidatePath("/team/utenti");
}

export async function maintenanceNow() {
  await assertRole(["amministratore"]);
  await runMaintenance();
  revalidatePath("/team/notifiche");
  revalidatePath("/team/configurazione");
}

export async function addStaffUser(formData: FormData) {
  const viewer = await assertRole(["amministratore"]);
  const input = z
    .object({
      name: z.string().trim().min(3).max(120),
      email: z.email().max(120),
      role: z.enum(["consulente", "amministratore"]),
    })
    .parse(Object.fromEntries(formData));
  const user = repo.createStaffUser(viewer, input);
  if (isMailReady() && isDeliverable(user.email)) {
    const link = teamUrl(`/team/imposta-password?token=${createToken("password", user.id, 60 * 60)}`);
    const to = user.email;
    after(() =>
      sendAccessEmail(
        to,
        "Il tuo accesso allo spazio team AURFIN",
        `Sei stato aggiunto allo spazio team AURFIN. Per impostare la password apri questo link, valido per un'ora:\n${link}`,
        "Invito al personale",
      ).catch(() => {}),
    );
  }
  revalidatePath("/team/utenti");
}

export async function setStaffActive(formData: FormData) {
  const viewer = await assertRole(["amministratore"]);
  const input = z.object({ userId: id, active: z.enum(["true", "false"]) }).parse(Object.fromEntries(formData));
  repo.setStaffActive(viewer, input.userId, input.active === "true");
  revalidatePath("/team/utenti");
}
