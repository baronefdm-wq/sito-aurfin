import "server-only";
import { site } from "@/config/site";
import { REQUEST_KINDS, STATUSES, type RequestStatus } from "@/lib/domain";
import { CALL_MINUTES, formatAppointment } from "@/lib/scheduling";
import { BOOKING_LINK_DAYS, bookingUrl } from "@/lib/server/booking-link";
import { sendClientEmail } from "@/lib/server/notifications";
import type { RequestRecord } from "@/lib/server/store";

/**
 * Comunicazioni di servizio al cliente. Contengono solo il minimo: codice e stato.
 * Documenti e note non vengono mai inviati per email. L'unica eccezione sugli importi
 * è il preventivo, scritto dal consulente e inviato da lui (emailQuoteReply).
 */

const signature = () =>
  [
    "",
    "AURFIN",
    site.company.legalName,
    site.company.registeredOffice,
    "",
    "Questa è una comunicazione di servizio relativa alla tua richiesta. L'eventuale valutazione e concessione del finanziamento spettano al soggetto finanziatore.",
  ]
    .filter((line) => line !== null)
    .join("\n");

const areaLink = () => new URL("/area-clienti/accesso", site.url).toString();

export function emailRequestReceived(r: RequestRecord) {
  const greeting = `Gentile ${r.contact.fullName},`;
  const subject = `Abbiamo ricevuto la tua richiesta ${r.reference}`;
  const lines = [
    greeting,
    "",
    `abbiamo ricevuto la tua ${REQUEST_KINDS[r.kind].toLowerCase()}. Il codice di riferimento è ${r.reference}.`,
    site.firstResponsePromise ?? "Ti risponderemo via email.",
    "",
    ...(r.clientUserId
      ? ["Puoi seguire la richiesta e caricare i documenti dall'area clienti, usando questo indirizzo email:", areaLink()]
      : []),
    signature(),
  ];
  return sendClientEmail({ to: r.contact.email, subject, text: lines.join("\n"), event: "conferma-cliente", title: "Conferma al cliente", requestId: r.id });
}

/**
 * Risposta del consulente con il preventivo: è l'unico punto in cui il cliente riceve
 * il link per prenotare una telefonata. Restituisce null se l'email è partita.
 */
export function emailQuoteReply(r: RequestRecord, body: string) {
  const lines = [
    body.trim(),
    "",
    "Per qualsiasi dubbio puoi rispondere a questa email. Se preferisci parlarne al telefono, scegli un orario da questo link personale:",
    bookingUrl(r.id),
    `La telefonata dura circa ${CALL_MINUTES} minuti e ti chiamiamo noi. Il link vale ${BOOKING_LINK_DAYS} giorni: non inoltrarlo ad altri.`,
    signature(),
  ];
  return sendClientEmail({
    to: r.contact.email,
    subject: `Il tuo preventivo AURFIN: richiesta ${r.reference}`,
    text: lines.join("\n"),
    event: "preventivo-cliente",
    title: "Preventivo inviato al cliente",
    requestId: r.id,
  });
}

/** Stati comunicati al cliente: i passaggi interni minori non generano email. */
const STATUS_MESSAGES: Partial<Record<RequestStatus, string>> = {
  consulenza: "Stiamo analizzando la tua esigenza con il consulente.",
  documenti: "Per proseguire servono alcuni documenti: trovi l'elenco aggiornato nell'area clienti.",
  valutazione: "La richiesta è stata presentata al finanziatore, che svolge le proprie verifiche.",
  proposta: "C'è un aggiornamento importante sulla tua richiesta: il consulente ti contatterà per illustrartelo.",
  conclusa: "La tua pratica è conclusa. Grazie per averci scelto.",
  "non-proseguita": "La tua richiesta non prosegue. Se vuoi maggiori informazioni puoi contattare il consulente.",
};

export function emailStatusChanged(r: RequestRecord) {
  const message = STATUS_MESSAGES[r.status];
  if (!message) return Promise.resolve(null);
  const lines = [
    `Gentile ${r.contact.fullName},`,
    "",
    `aggiornamento sulla richiesta ${r.reference}: ${STATUSES[r.status].client}.`,
    message,
    "",
    ...(r.clientUserId ? ["Area clienti:", areaLink()] : []),
    signature(),
  ];
  return sendClientEmail({
    to: r.contact.email,
    subject: `Aggiornamento sulla richiesta ${r.reference}`,
    text: lines.join("\n"),
    event: "stato-cliente",
    title: `Aggiornamento al cliente: ${STATUSES[r.status].label}`,
    requestId: r.id,
  });
}

export function emailDocumentRequested(r: RequestRecord, label: string) {
  const lines = [
    `Gentile ${r.contact.fullName},`,
    "",
    `per proseguire con la richiesta ${r.reference} abbiamo bisogno di questo documento: ${label}.`,
    "Puoi caricarlo in modo sicuro dall'area clienti. Non inviare documenti rispondendo a questa email.",
    "",
    areaLink(),
    signature(),
  ];
  return sendClientEmail({
    to: r.contact.email,
    subject: `Documento richiesto per la pratica ${r.reference}`,
    text: lines.join("\n"),
    event: "documento-cliente",
    title: "Richiesta documento al cliente",
    requestId: r.id,
  });
}

export function emailAppointmentChanged(r: RequestRecord, startsAt: string, change: "fissata" | "spostata" | "annullata") {
  const text = {
    fissata: `la telefonata è fissata per ${formatAppointment(startsAt)}: ti chiamiamo noi al numero indicato.`,
    spostata: `la telefonata è stata spostata a ${formatAppointment(startsAt)}: ti chiamiamo noi al numero indicato.`,
    annullata: `la telefonata di ${formatAppointment(startsAt)} è stata annullata. Se vuoi, puoi prenotarne un'altra da questo link personale: ${bookingUrl(r.id)}`,
  }[change];
  return sendClientEmail({
    to: r.contact.email,
    subject: `Telefonata ${change}: richiesta ${r.reference}`,
    text: [`Gentile ${r.contact.fullName},`, "", `per la richiesta ${r.reference}, ${text}`, signature()].join("\n"),
    event: "appuntamento-cliente",
    title: `Telefonata ${change}: avviso al cliente`,
    requestId: r.id,
  });
}
