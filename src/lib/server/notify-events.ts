import "server-only";
import { SOLUTIONS, WORK_CATEGORIES } from "@/lib/domain";
import { formatAppointment } from "@/lib/scheduling";
import type { NotifyEvent } from "@/lib/server/notifications";
import { getUser, type RequestRecord } from "@/lib/server/store";
import { formatEuro } from "@/lib/utils";

/** Costruzione dei messaggi di notifica: solo i dati utili a smistare la richiesta. */

const base = (r: RequestRecord) => ({ reference: r.reference, requestId: r.id });

export function quoteEvent(r: RequestRecord): NotifyEvent {
  return {
    type: "preventivo",
    title: "Nuova richiesta di preventivo",
    ...base(r),
    lines: [
      `Richiedente: ${r.contact.fullName}`,
      `Soluzione: ${r.solution ? SOLUTIONS[r.solution] : "—"}`,
      `Situazione lavorativa: ${r.workCategory ? WORK_CATEGORIES[r.workCategory] : "—"}`,
      `Importo e durata: ${r.amount ? formatEuro(r.amount) : "—"} in ${r.durationMonths ?? "—"} mesi`,
      "Gli eventuali documenti allegati sono visibili nella pratica.",
    ],
  };
}

export function bookingEvent(r: RequestRecord): NotifyEvent {
  return {
    type: "consulenza",
    title: "Nuova telefonata prenotata",
    ...base(r),
    lines: [
      `Richiedente: ${r.contact.fullName}`,
      `Argomento: ${r.solution ? SOLUTIONS[r.solution] : "—"}`,
      r.booking?.startsAt ? `Telefonata: ${formatAppointment(r.booking.startsAt)}` : "Telefonata: da fissare",
    ],
  };
}
export function proposalEvent(r: RequestRecord): NotifyEvent {
  const advisor = r.assigneeId ? getUser(r.assigneeId)?.name : null;
  return {
    type: "proposta",
    title: "Proposta disponibile",
    ...base(r),
    lines: [`Cliente: ${r.contact.fullName}`, `Consulente: ${advisor ?? "non assegnato"}`, "La pratica è passata allo stato «Proposta disponibile»."],
  };
}

export function clientDocumentEvent(r: RequestRecord, label: string): NotifyEvent {
  return {
    type: "documenti",
    title: "Nuovo documento caricato dal cliente",
    ...base(r),
    lines: [`Cliente: ${r.contact.fullName}`, `Documento: ${label}`],
  };
}
