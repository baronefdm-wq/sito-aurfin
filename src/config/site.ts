/**
 * Configurazione centralizzata di identità aziendale, recapiti e collegamenti.
 *
 * Regola: ogni dato non verificato resta `null`. I componenti non mostrano
 * recapiti, iscrizioni o sezioni (team, partner, mappa, WhatsApp) finché il
 * relativo valore non è compilato qui. In modalità revisione al posto dei dati
 * mancanti compare un segnaposto riconoscibile.
 */

export type OpeningHours = { days: string; hours: string };

export type TeamMember = { name: string; role: string; bio?: string };

export type SiteConfig = {
  name: string;
  url: string;
  tagline: string;
  description: string;
  company: {
    legalName: string | null;
    legalForm: string | null;
    vatNumber: string | null;
    taxCode: string | null;
    rea: string | null;
    shareCapital: string | null;
    registeredOffice: string | null;
    pec: string | null;
  };
  registration: {
    /** Ruolo effettivo dell'intermediario, da confermare. */
    role: "agente-attivita-finanziaria" | "mediatore-creditizio" | "altro" | null;
    /** Es. "Elenco Agenti in attività finanziaria" o "Elenco Mediatori creditizi". */
    register: string | null;
    number: string | null;
    /** Data di iscrizione all'elenco, nel formato gg/mm/aaaa. */
    registeredAt: string | null;
    /** Per gli agenti: soggetti mandanti, solo se verificati. */
    principals: string[];
  };
  contacts: {
    phone: string | null;
    email: string | null;
    address: string | null;
    hours: OpeningHours[] | null;
    /** Numero WhatsApp autorizzato in formato internazionale senza "+" (es. 39333...). */
    whatsapp: string | null;
    /** Link a una mappa esterna, solo per una sede reale. */
    mapUrl: string | null;
  };
  complaints: { email: string | null; pec: string | null; address: string | null };
  team: TeamMember[];
  /** Impegno pubblico sui tempi, solo se AURFIN è in grado di rispettarlo (es. "Ti ricontattiamo entro un giorno lavorativo."). */
  firstResponsePromise: string | null;
  /** Mostra segnaposto e note "da validare" (bozza per la revisione interna). */
  reviewMode: boolean;
  links: { oamRegistry: string; abf: string; bancaItaliaEducation: string };
};

export const site: SiteConfig = {
  name: "AURFIN",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  tagline: "Intermediazione del credito per la persona",
  description:
    "AURFIN accompagna chi valuta una cessione del quinto, un prestito per delega o un prestito personale: ascolta l'esigenza, chiarisce le opzioni e segue la richiesta passo dopo passo.",
  // Fonte: visura ordinaria CCIAA Roma estratta il 02/11/2026 (stato attività: attiva, inizio attività 26/03/2026).
  company: {
    legalName: "Aurora Finance Agente in Attività Finanziaria S.r.l.",
    legalForm: "Società a responsabilità limitata (sigla AURFIN S.r.l.)",
    vatNumber: "16082731007",
    taxCode: "16082731007",
    rea: "RM-1633525",
    shareCapital: "€ 10.200,00 sottoscritto, € 2.550,00 versato",
    registeredOffice: "Via Ciro Menotti 26, 00195 Roma (RM)",
    pec: "aurfin@pec.it",
  },
  registration: {
    // Oggetto sociale esclusivo: attività di agente in attività finanziaria (Titolo VI-bis TUB).
    // Fonte: scheda dell'elenco OAM (stato "iscritto", autorizzato ad operare) e visura del 02/11/2026.
    role: "agente-attivita-finanziaria",
    register: "Elenco degli Agenti in attività finanziaria",
    number: "A14406",
    registeredAt: "07/10/2021",
    principals: [], // intermediari mandanti: da indicare (obbligo di trasparenza per l'agente)
  },
  contacts: {
    phone: null,
    // Unico recapito sul sito; è anche l'indirizzo di risposta delle email ai clienti.
    email: "info@aurfin.it",
    address: null,
    hours: null,
    whatsapp: null,
    mapUrl: null,
  },
  complaints: { email: null, pec: null, address: null },
  team: [],
  firstResponsePromise: "Ti rispondiamo via email con il preventivo entro un giorno lavorativo.",
  reviewMode: process.env.NEXT_PUBLIC_REVIEW_MODE !== "false",
  links: {
    oamRegistry: "https://www.organismo-am.it",
    abf: "https://www.arbitrobancariofinanziario.it",
    bancaItaliaEducation: "https://economiapertutti.bancaditalia.it",
  },
};

export type MissingItem = { area: string; label: string };

/** Elenco dei dati ancora mancanti, usato dalla checklist di pubblicazione. */
export function getMissingSiteData(config: SiteConfig = site): MissingItem[] {
  const missing: MissingItem[] = [];
  const c = config.company;
  const push = (area: string, label: string, value: unknown) => {
    if (value === null || value === "" || (Array.isArray(value) && value.length === 0)) {
      missing.push({ area, label });
    }
  };
  push("Identità societaria", "Ragione sociale", c.legalName);
  push("Identità societaria", "Forma giuridica", c.legalForm);
  push("Identità societaria", "Partita IVA", c.vatNumber);
  push("Identità societaria", "Codice fiscale", c.taxCode);
  push("Identità societaria", "Numero REA", c.rea);
  push("Identità societaria", "Sede legale", c.registeredOffice);
  push("Identità societaria", "PEC", c.pec);
  push("Identità societaria", "Capitale sociale", c.shareCapital);
  push("Iscrizioni", "Ruolo dell'intermediario", config.registration.role);
  push("Iscrizioni", "Elenco OAM di iscrizione", config.registration.register);
  push("Iscrizioni", "Intermediari mandanti (agente in attività finanziaria)", config.registration.principals);
  push("Iscrizioni", "Numero di iscrizione OAM", config.registration.number);
  push("Iscrizioni", "Data di iscrizione OAM", config.registration.registeredAt);
  push("Recapiti", "Email per il pubblico", config.contacts.email);
  push("Reclami", "Recapito per i reclami", config.complaints.email ?? config.complaints.pec);
  return missing;
}

/** Verifiche emerse dai documenti societari, da chiudere prima della pubblicazione. */
export const publicationBlockers: string[] = [
  "Subito prima del lancio, ricontrollare sul sito OAM che l'iscrizione n. A14406 risulti ancora attiva e autorizzata ad operare.",
  "Indicare gli intermediari mandanti per conto dei quali AURFIN opera, come richiesto per gli agenti in attività finanziaria.",
  "Verificare che info@aurfin.it riceva posta e sia letta ogni giorno lavorativo: è l'unico recapito sul sito e riceve le risposte dei clienti ai preventivi.",
];

export function hasCompanyIdentity(config: SiteConfig = site) {
  return Boolean(config.company.legalName && config.company.vatNumber);
}
