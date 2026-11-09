import type { Solution, WorkCategory } from "@/lib/domain";

/**
 * Documenti suggeriti in base a soluzione e situazione lavorativa.
 * Sono tutti facoltativi in fase di richiesta: l'elenco definitivo lo
 * conferma il consulente in base al finanziatore. Da validare con la compliance.
 */
export type DocumentSlot = { id: string; label: string; hint: string };

const SLOTS = {
  identita: { id: "identita", label: "Documento di identità", hint: "Fronte e retro, in corso di validità." },
  codiceFiscale: { id: "codice-fiscale", label: "Codice fiscale o tessera sanitaria", hint: "Fronte e retro." },
  bustePaga: { id: "buste-paga", label: "Ultime due buste paga", hint: "Le più recenti disponibili." },
  certificatoStipendio: {
    id: "certificato-stipendio",
    label: "Certificato di stipendio",
    hint: "Se già disponibile: lo rilascia il datore di lavoro. Serve se lo chiede il finanziatore.",
  },
  estrattoInps: {
    id: "estratto-contributivo-inps",
    label: "Estratto conto contributivo INPS",
    hint: "Aggiornato: puoi scaricarlo dal sito dell'INPS.",
  },
  iban: {
    id: "iban",
    label: "IBAN intestato a te",
    hint: "Un documento della banca con IBAN e intestatario, ad esempio la prima pagina dell'estratto conto.",
  },
  cedolino: { id: "cedolino-pensione", label: "Ultimo cedolino della pensione", hint: "Il più recente disponibile." },
  quotaCedibile: {
    id: "quota-cedibile",
    label: "Comunicazione della quota cedibile",
    hint: "Se l'hai già richiesta all'ente pensionistico.",
  },
  cu: { id: "certificazione-unica", label: "Certificazione Unica", hint: "L'ultima disponibile." },
  redditi: { id: "dichiarazione-redditi", label: "Dichiarazione dei redditi", hint: "L'ultima presentata." },
  finanziamenti: {
    id: "finanziamenti-in-corso",
    label: "Finanziamenti in corso",
    hint: "Solo se ne hai: contratti o conteggi estintivi.",
  },
  certificatiEstintivi: {
    id: "certificati-estintivi",
    label: "Certificati estintivi",
    hint: "Eventuali certificati estintivi di cessioni del quinto o prestiti per delega (si ricorda che per rinnovare bisogna aver pagato il 40% del prestito, art. 39 del D.P.R. 5 gennaio 1950, n. 180).",
  },
  altro: { id: "altro", label: "Altro documento utile", hint: "Qualsiasi altro documento che ritieni utile." },
} satisfies Record<string, DocumentSlot>;

export function getDocumentSlots(solution?: Solution | null, work?: WorkCategory | null): DocumentSlot[] {
  const slots: DocumentSlot[] = [SLOTS.identita, SLOTS.codiceFiscale];
  const salaryBacked = solution === "cessione-quinto" || solution === "prestito-delega";

  if (work === "pensionato") {
    slots.push(SLOTS.cedolino, SLOTS.cu);
    if (solution === "cessione-quinto" || solution === "consiglio") slots.push(SLOTS.quotaCedibile);
    if (solution === "cessione-quinto") slots.push(SLOTS.iban);
  } else if (work === "dipendente-pubblico" || work === "dipendente-privato") {
    slots.push(SLOTS.bustePaga, SLOTS.cu);
    if (salaryBacked || solution === "consiglio") slots.push(SLOTS.certificatoStipendio);
    // Check-list AURFIN per cessione del quinto e delega dei dipendenti.
    if (salaryBacked) slots.push(SLOTS.estrattoInps, SLOTS.iban);
  } else {
    slots.push(SLOTS.redditi);
  }

  // Per cessione e delega bastano i certificati estintivi; per gli altri casi restano finanziamenti in corso e «Altro».
  if (salaryBacked) slots.push(SLOTS.certificatiEstintivi);
  else slots.push(SLOTS.finanziamenti, SLOTS.altro);
  return slots;
}

export function isKnownSlot(id: string) {
  return Object.values(SLOTS).some((s) => s.id === id);
}
