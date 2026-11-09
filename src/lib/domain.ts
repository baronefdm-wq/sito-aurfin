/** Vocabolario di dominio condiviso tra client e server. */

export const SOLUTIONS = {
  "cessione-quinto": "Cessione del quinto",
  "prestito-delega": "Prestito per delega",
  "prestito-personale": "Prestito personale",
  consiglio: "Vorrei un consiglio",
} as const;
export type Solution = keyof typeof SOLUTIONS;
export const SOLUTION_KEYS = Object.keys(SOLUTIONS) as [Solution, ...Solution[]];

export const WORK_CATEGORIES = {
  "dipendente-pubblico": "Dipendente pubblico o statale",
  "dipendente-privato": "Dipendente di azienda privata",
  pensionato: "Pensionato o pensionata",
  altro: "Altra situazione lavorativa",
} as const;
export type WorkCategory = keyof typeof WORK_CATEGORIES;
export const WORK_CATEGORY_KEYS = Object.keys(WORK_CATEGORIES) as [WorkCategory, ...WorkCategory[]];

/** Intervalli del configuratore: limiti dell'interfaccia, non condizioni di prodotto. */
export const AMOUNT_RANGE = { min: 1000, max: 100000, step: 500, default: 15000 } as const;
export const DURATION_OPTIONS = [12, 24, 36, 48, 60, 72, 84, 96, 108, 120] as const;
export const DEFAULT_DURATION = 60;

/**
 * Pre-qualifica facoltativa: fasce indicative per preparare il colloquio.
 * Non determina alcun esito: la valutazione spetta sempre al finanziatore.
 */
export const CONTRACT_TYPES = { indeterminato: "A tempo indeterminato", determinato: "A tempo determinato", altro: "Altro" } as const;
export const SENIORITY_BANDS = { "meno-1": "Meno di 1 anno", "1-3": "Da 1 a 3 anni", "3-10": "Da 3 a 10 anni", "oltre-10": "Oltre 10 anni" } as const;
export const EMPLOYER_SIZES = { "fino-15": "Fino a 15 dipendenti", "16-249": "Da 16 a 249 dipendenti", "250-oltre": "250 dipendenti o più", "non-so": "Non lo so" } as const;
export const INCOME_BANDS = {
  "fino-1000": "Fino a 1.000 €",
  "1000-1500": "Da 1.000 a 1.500 €",
  "1500-2000": "Da 1.500 a 2.000 €",
  "2000-3000": "Da 2.000 a 3.000 €",
  "oltre-3000": "Oltre 3.000 €",
} as const;
export const EXISTING_LOANS = {
  nessuno: "Nessuno",
  "cessione-delega": "Cessione del quinto o delega",
  altri: "Altri prestiti o mutui",
  entrambi: "Entrambi",
} as const;
export const AGE_BANDS = { "fino-65": "Fino a 65 anni", "66-70": "Da 66 a 70 anni", "71-75": "Da 71 a 75 anni", "oltre-75": "Oltre 75 anni" } as const;

/**
 * Frazione della durata dopo la quale una cessione è di norma rinnovabile
 * (2/5, DPR 180/1950). Stima da confermare con mandante e compliance.
 */
export const RENEWAL_FRACTION = 0.4;

export const CONTACT_PREFERENCES = { telefono: "Telefono", email: "Email" } as const;
export const TIME_SLOTS = {
  mattina: "In mattinata",
  pomeriggio: "Nel pomeriggio",
  indifferente: "Indifferente",
} as const;

export const MEETING_MODES = {
  telefono: "Telefonata",
  videochiamata: "Videochiamata",
  sede: "In sede",
} as const;
export type MeetingMode = keyof typeof MEETING_MODES;

export const WEEKDAYS = {
  lun: "Lunedì",
  mar: "Martedì",
  mer: "Mercoledì",
  gio: "Giovedì",
  ven: "Venerdì",
} as const;

export const CONTACT_TOPICS = {
  informazioni: "Informazioni generali",
  richiesta: "Una richiesta già inviata",
  documenti: "Documenti e avanzamento",
  privacy: "Privacy e dati personali",
  altro: "Altro",
} as const;

export const ROLES = {
  cliente: "Cliente",
  consulente: "Consulente",
  amministratore: "Amministratore",
} as const;
export type Role = keyof typeof ROLES;

export const REQUEST_KINDS = {
  preventivo: "Richiesta di preventivo",
  consulenza: "Prenotazione consulenza",
  contatto: "Messaggio di contatto",
} as const;
export type RequestKind = keyof typeof REQUEST_KINDS;

/** Stati della pratica, nell'ordine del percorso. */
export const STATUSES = {
  nuova: { label: "Nuova", client: "Richiesta ricevuta" },
  contattato: { label: "Primo contatto", client: "Primo contatto con il consulente" },
  consulenza: { label: "Consulenza", client: "Consulenza e analisi dell'esigenza" },
  documenti: { label: "Raccolta documenti", client: "Raccolta della documentazione" },
  valutazione: { label: "In valutazione", client: "Valutazione presso il finanziatore" },
  proposta: { label: "Proposta disponibile", client: "Esito e eventuale proposta" },
  conclusa: { label: "Conclusa", client: "Pratica conclusa" },
  "non-proseguita": { label: "Non proseguita", client: "Richiesta non proseguita" },
} as const;
export type RequestStatus = keyof typeof STATUSES;
export const STATUS_KEYS = Object.keys(STATUSES) as [RequestStatus, ...RequestStatus[]];
/** Passaggi mostrati nella timeline del cliente. */
export const CLIENT_TIMELINE: RequestStatus[] = ["nuova", "contattato", "consulenza", "documenti", "valutazione", "proposta"];

export const DOCUMENT_STATUSES = {
  "da-caricare": "Da fornire",
  ricevuto: "Ricevuto",
  "da-integrare": "Da integrare",
  verificato: "Verificato",
} as const;
export type DocumentStatus = keyof typeof DOCUMENT_STATUSES;

export const APPOINTMENT_STATUSES = {
  proposto: "Da confermare",
  confermato: "Confermato",
  svolto: "Svolto",
  annullato: "Annullato",
} as const;
export type AppointmentStatus = keyof typeof APPOINTMENT_STATUSES;
