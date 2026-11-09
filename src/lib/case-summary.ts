import { STATUSES, type DocumentStatus, type RequestStatus } from "@/lib/domain";

/** Sintesi di una pratica per il personale: documenti, completezza, prossimo passo, contatti rapidi. */

type DocLike = { id: string; label: string; status: DocumentStatus };
type PrequalLike = {
  contractType: string | null;
  seniority: string | null;
  employerSize: string | null;
  incomeBand: string | null;
  existingLoans: string | null;
  ageBand: string | null;
};
type CaseLike = {
  status: RequestStatus;
  kind: "preventivo" | "consulenza" | "contatto";
  assigneeId: string | null;
  documents: DocLike[];
  contact: { phone: string | null };
  prequal: PrequalLike | null;
  solution: string | null;
  workCategory: string | null;
  createdAt: string;
};

/** Documenti facoltativi che non contano come "mancanti". */
const OPTIONAL_DOCS = new Set(["finanziamenti-in-corso", "altro"]);

export function documentProgress(c: Pick<CaseLike, "documents">) {
  const relevant = c.documents.filter((d) => !OPTIONAL_DOCS.has(d.id));
  const missing = relevant.filter((d) => d.status === "da-caricare" || d.status === "da-integrare");
  const received = relevant.filter((d) => d.status === "ricevuto" || d.status === "verificato");
  const toCheck = relevant.filter((d) => d.status === "ricevuto");
  return {
    total: relevant.length,
    received: received.length,
    missing,
    toCheck,
    percent: relevant.length ? Math.round((received.length / relevant.length) * 100) : 0,
  };
}

export function isClosed(status: RequestStatus) {
  return status === "conclusa" || status === "non-proseguita";
}

/**
 * Completezza della richiesta: ordina il lavoro del consulente secondo le
 * informazioni già disponibili. NON è una valutazione del cliente né del
 * merito creditizio, che spetta al finanziatore.
 */
export function readiness(c: CaseLike) {
  if (c.kind !== "preventivo") return { level: 1, label: "Da leggere" };
  const docs = documentProgress(c);
  const answered = c.prequal ? Object.values(c.prequal).filter(Boolean).length : 0;
  if (docs.percent >= 50 && answered > 0) return { level: 3, label: "Quasi completa" };
  if (docs.received > 0 || answered >= 2) return { level: 2, label: "Parziale" };
  return { level: 1, label: "Da completare" };
}

/** Ore di attesa del primo contatto (0 se già contattata). */
export function waitingHours(c: Pick<CaseLike, "status" | "createdAt">, now = Date.now()) {
  if (c.status !== "nuova") return 0;
  return Math.max(0, Math.floor((now - new Date(c.createdAt).getTime()) / 3_600_000));
}

export function formatWaiting(hours: number) {
  if (hours < 24) return `${hours} ${hours === 1 ? "ora" : "ore"}`;
  const days = Math.floor(hours / 24);
  return `${days} ${days === 1 ? "giorno" : "giorni"}`;
}

/** Spunti per il colloquio ricavati dalle risposte: verifiche da fare, non esiti. */
export function prequalHints(c: Pick<CaseLike, "prequal" | "solution" | "workCategory">) {
  const p = c.prequal;
  if (!p) return [];
  const salaryBacked = c.solution === "cessione-quinto" || c.solution === "prestito-delega";
  const hints: string[] = [];
  if (p.contractType === "determinato" && salaryBacked) hints.push("Contratto a termine: verificare i requisiti con il mandante.");
  if (p.seniority === "meno-1" && salaryBacked) hints.push("Anzianità inferiore a un anno: verificare i requisiti con il mandante.");
  if (p.employerSize === "fino-15" && salaryBacked) hints.push("Azienda di piccole dimensioni: verificare i requisiti con il mandante.");
  if (p.existingLoans === "cessione-delega" || p.existingLoans === "entrambi") {
    hints.push("Cessione o delega già attiva: chiedere il conteggio estintivo e verificare la quota disponibile.");
  }
  if (c.solution === "prestito-delega") hints.push("Delega: verificare per prima cosa la disponibilità del datore di lavoro.");
  if (p.ageBand === "71-75" || p.ageBand === "oltre-75") hints.push("Età: verificare i limiti alla fine del piano con il mandante.");
  return hints;
}

export function nextStep(c: CaseLike): string {
  const docs = documentProgress(c);
  if (isClosed(c.status)) return "Pratica chiusa: nessuna azione richiesta.";
  if (!c.assigneeId) return "Assegnare la richiesta a un consulente.";
  if (c.status === "nuova") {
    return c.kind === "consulenza"
      ? "Contattare il cliente per fissare la consulenza nei giorni indicati."
      : c.kind === "contatto"
        ? "Rispondere al messaggio del cliente."
        : "Inviare il preventivo via email entro un giorno lavorativo.";
  }
  if (c.status === "valutazione") return "In attesa dell'esito del finanziatore.";
  if (c.status === "proposta") return "Illustrare la proposta al cliente e raccogliere la sua decisione.";
  if (docs.toCheck.length) return `Verificare ${docs.toCheck.length} ${docs.toCheck.length === 1 ? "documento ricevuto" : "documenti ricevuti"}.`;
  if (docs.missing.length && (c.status === "consulenza" || c.status === "documenti")) {
    return `Sollecitare ${docs.missing.length} ${docs.missing.length === 1 ? "documento mancante" : "documenti mancanti"}.`;
  }
  if (c.status === "documenti" && !docs.missing.length) return "Documentazione completa: presentare la richiesta al finanziatore.";
  return `Proseguire dalla fase «${STATUSES[c.status].label}».`;
}

/** Numero in formato internazionale per link WhatsApp/telefono (default Italia). */
export function internationalPhone(phone: string | null) {
  if (!phone) return null;
  const digits = phone.replace(/[^\d+]/g, "");
  if (digits.startsWith("+")) return digits.slice(1);
  if (digits.startsWith("00")) return digits.slice(2);
  if (/^3\d{8,9}$/.test(digits) || /^0\d{5,10}$/.test(digits)) return `39${digits}`;
  return digits;
}
