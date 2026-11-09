import "server-only";
import { randomUUID } from "node:crypto";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { isDemo } from "@/lib/server/env";
import { addDays, isWorkday, romeDate, romeToIso, type ClosureRule } from "@/lib/scheduling";
import type {
  AppointmentStatus,
  DocumentStatus,
  MeetingMode,
  RequestKind,
  RequestStatus,
  Role,
  Solution,
  WorkCategory,
} from "@/lib/domain";

/**
 * Archivio permanente su SQLite (modulo integrato in Node.js, nessun servizio esterno).
 *
 * Il database è letto all'avvio e tenuto in memoria; ogni modifica viene scritta
 * subito su disco (write-through). Funziona quindi con UNA sola istanza
 * dell'applicazione: per più istanze sostituire questo modulo con un database
 * di rete (es. PostgreSQL) mantenendo le stesse funzioni esportate.
 *
 * - DATA_MODE=demo: file data/aurfin-demo.db, con DATI SINTETICI al primo avvio
 *   (nomi, recapiti e pratiche inventati). Nessuna persona reale.
 * - DATA_MODE=live: file data/aurfin.db, parte vuoto.
 * DATABASE_PATH permette di indicare un altro percorso.
 */

export type User = {
  id: string;
  role: Role;
  name: string;
  email: string;
  phone?: string;
  /** Preferenze del cliente */
  preferences?: { contact: "telefono" | "email"; marketing: boolean; reminders: boolean };
  /** Disattivato: non può più accedere, le sessioni aperte decadono. */
  active?: boolean;
  /** Solo personale: hash scrypt della password. Mai esposto al browser. */
  passwordHash?: string;
  /** Incrementato per invalidare le sessioni aperte (es. cambio password). */
  sessionVersion?: number;
  lastLoginAt?: string;
};

/** Risposte facoltative di pre-qualifica: orientano il colloquio, non sono una valutazione. */
export type Prequal = {
  contractType: string | null;
  seniority: string | null;
  employerSize: string | null;
  incomeBand: string | null;
  existingLoans: string | null;
  ageBand: string | null;
};

/** Finanziamento erogato, registrato dal team: base per i rinnovi e per i numeri. */
export type Contract = {
  disbursedAt: string;
  amount: number;
  durationMonths: number;
  lender: string;
  installment: number | null;
  renewalContactedAt: string | null;
};

export type Note = { id: string; authorId: string; createdAt: string; body: string };
export type Appointment = {
  id: string;
  requestId: string;
  startsAt: string;
  mode: MeetingMode;
  status: AppointmentStatus;
  staffId: string | null;
  note?: string;
  /** Versione dell'invito di calendario già inviato. */
  calendarSequence?: number;
};
export type HistoryEntry = { id: string; at: string; actorId: string | null; summary: string };
export type DocumentItem = { id: string; label: string; description: string; status: DocumentStatus };
export type Attachment = {
  id: string;
  documentId: string;
  originalName: string;
  size: number;
  mime: string;
  /** Chiave nello storage privato: mai esposta al browser. */
  storageKey: string;
  uploadedAt: string;
  uploadedBy: "sito" | "cliente" | "personale";
};

export type RequestRecord = {
  id: string;
  reference: string;
  kind: RequestKind;
  createdAt: string;
  updatedAt: string;
  status: RequestStatus;
  solution: Solution | null;
  workCategory: WorkCategory | null;
  amount: number | null;
  durationMonths: number | null;
  contact: {
    fullName: string;
    email: string;
    phone: string | null;
    preference: "telefono" | "email" | null;
    timeSlot: string | null;
  };
  message: string;
  /** Telefonata prenotata dal sito. `days` e `timeSlot` restano solo sulle richieste precedenti al planner. */
  booking: { mode: MeetingMode; startsAt?: string; days?: string[]; timeSlot?: string } | null;
  topic: string | null;
  privacyAckAt: string;
  marketingConsent: boolean;
  assigneeId: string | null;
  clientUserId: string | null;
  notes: Note[];
  history: HistoryEntry[];
  documents: DocumentItem[];
  attachments: Attachment[];
  synthetic: boolean;
  prequal: Prequal | null;
  /** Provenienza non personale (es. codice convenzione dal link ?canale=). */
  channel: string | null;
  /** Prima uscita dallo stato "nuova": misura il tempo di primo contatto. */
  firstContactAt: string | null;
  /** Presa visione dell'informativa sull'intermediario prima di allegare documenti. */
  agentInfoAckAt: string | null;
  contract: Contract | null;
  slaNotifiedAt: string | null;
  renewalNotifiedAt: string | null;
  /** Pratica di origine, se questa è una richiesta di rinnovo. */
  renewalOfId: string | null;
};

/** Chiusura del calendario decisa dal team (ferie, riunioni, festività locali). */
export type Closure = ClosureRule & { id: string; createdBy: string; createdAt: string };

export type Settings = {
  /** Assegna le nuove richieste al consulente con meno pratiche aperte. */
  autoAssign: boolean;
  /** Invia ai clienti conferme e aggiornamenti di stato via email. */
  clientEmails: boolean;
};

export type NotificationLog = {
  id: string;
  at: string;
  event: string;
  title: string;
  channel: "email" | "whatsapp";
  /** Destinatario mascherato: il registro non conserva indirizzi completi. */
  recipient: string;
  status: "inviata" | "non-configurata" | "disattivata" | "errore";
  detail: string;
  requestId: string | null;
};

type Store = {
  users: User[];
  requests: RequestRecord[];
  appointments: Appointment[];
  notifications: NotificationLog[];
  closures: Closure[];
  settings: Settings;
  seq: number;
};

const NEW_REQUEST_FIELDS = {
  prequal: null,
  channel: null,
  firstContactAt: null,
  agentInfoAckAt: null,
  contract: null,
  slaNotifiedAt: null,
  renewalNotifiedAt: null,
  renewalOfId: null,
} satisfies Partial<RequestRecord>;

const daysAgo = (d: number, h = 10) => {
  const date = new Date();
  date.setDate(date.getDate() - d);
  date.setHours(h, 0, 0, 0);
  return date.toISOString();
};
const daysAhead = (d: number, h = 10, m = 0) => {
  const date = new Date();
  date.setDate(date.getDate() + d);
  date.setHours(h, m, 0, 0);
  return date.toISOString();
};

const STANDARD_DOCS: Omit<DocumentItem, "status">[] = [
  { id: "doc-id", label: "Documento di identità", description: "Fronte e retro, in corso di validità." },
  { id: "doc-cf", label: "Codice fiscale o tessera sanitaria", description: "Fronte e retro." },
  { id: "doc-income", label: "Ultime buste paga o cedolino pensione", description: "Le più recenti disponibili." },
  { id: "doc-cu", label: "Certificazione Unica", description: "Ultima disponibile." },
];

function seed(): Store {
  const users: User[] = [
    {
      id: "u-cli-1",
      role: "cliente",
      name: "Giulia Ferri",
      email: "giulia.ferri@esempio.invalid",
      phone: "000 0000001",
      preferences: { contact: "email", marketing: false, reminders: true },
    },
    { id: "u-con-1", role: "consulente", name: "Marco Rinaldi", email: "m.rinaldi@esempio.invalid", phone: "000 0000101" },
    { id: "u-con-2", role: "consulente", name: "Elena Sarti", email: "e.sarti@esempio.invalid", phone: "000 0000102" },
    { id: "u-adm-1", role: "amministratore", name: "Paola Conti", email: "p.conti@esempio.invalid" },
  ];

  const base = (over: Partial<RequestRecord> & Pick<RequestRecord, "id" | "reference">): RequestRecord => ({
    kind: "preventivo",
    createdAt: daysAgo(3),
    updatedAt: daysAgo(3),
    status: "nuova",
    solution: "cessione-quinto",
    workCategory: "dipendente-pubblico",
    amount: 15000,
    durationMonths: 60,
    contact: { fullName: "", email: "", phone: null, preference: "telefono", timeSlot: "mattina" },
    message: "",
    booking: null,
    topic: null,
    privacyAckAt: daysAgo(3),
    marketingConsent: false,
    assigneeId: null,
    clientUserId: null,
    notes: [],
    history: [],
    documents: [],
    attachments: [],
    synthetic: true,
    ...NEW_REQUEST_FIELDS,
    ...over,
  });

  const requests: RequestRecord[] = [
    base({
      id: "r-1001",
      reference: "AUR-DEMO-1001",
      createdAt: daysAgo(12),
      updatedAt: daysAgo(1),
      status: "documenti",
      solution: "cessione-quinto",
      workCategory: "dipendente-pubblico",
      amount: 18000,
      durationMonths: 84,
      contact: {
        fullName: "Giulia Ferri",
        email: "giulia.ferri@esempio.invalid",
        phone: "000 0000001",
        preference: "email",
        timeSlot: "pomeriggio",
      },
      message: "Vorrei capire se posso estinguere un finanziamento in corso.",
      assigneeId: "u-con-1",
      clientUserId: "u-cli-1",
      documents: [
        { ...STANDARD_DOCS[0], status: "verificato" },
        { ...STANDARD_DOCS[1], status: "ricevuto" },
        { ...STANDARD_DOCS[2], status: "da-integrare" },
        { ...STANDARD_DOCS[3], status: "da-caricare" },
        {
          id: "doc-loan",
          label: "Conteggio estintivo del finanziamento in corso",
          description: "Richiedilo all'ente che ha erogato il finanziamento attuale.",
          status: "da-caricare",
        },
      ],
      notes: [
        {
          id: "n-1",
          authorId: "u-con-1",
          createdAt: daysAgo(10, 11),
          body: "Prima telefonata svolta. Ha un finanziamento in corso: chiedere il conteggio estintivo prima di procedere.",
        },
        {
          id: "n-2",
          authorId: "u-con-1",
          createdAt: daysAgo(1, 16),
          body: "Busta paga di settembre poco leggibile: chiesto un nuovo invio.",
        },
      ],
      history: [
        { id: "h-1", at: daysAgo(12), actorId: null, summary: "Richiesta ricevuta dal sito" },
        { id: "h-2", at: daysAgo(11, 9), actorId: "u-adm-1", summary: "Assegnata a Marco Rinaldi" },
        { id: "h-3", at: daysAgo(10, 11), actorId: "u-con-1", summary: "Stato: Nuova → Primo contatto" },
        { id: "h-4", at: daysAgo(7, 15), actorId: "u-con-1", summary: "Stato: Primo contatto → Consulenza" },
        { id: "h-5", at: daysAgo(4, 12), actorId: "u-con-1", summary: "Stato: Consulenza → Raccolta documenti" },
        { id: "h-6", at: daysAgo(1, 16), actorId: "u-con-1", summary: "Documento «Ultime buste paga» segnato da integrare" },
      ],
    }),
    base({
      id: "r-1002",
      reference: "AUR-DEMO-1002",
      createdAt: daysAgo(0, 9),
      updatedAt: daysAgo(0, 9),
      solution: "consiglio",
      workCategory: "pensionato",
      amount: 8000,
      durationMonths: 48,
      contact: {
        fullName: "Antonio Galli",
        email: "a.galli@esempio.invalid",
        phone: "000 0000002",
        preference: "telefono",
        timeSlot: "mattina",
      },
      message: "Non so quale soluzione sia più adatta, preferisco parlarne al telefono.",
      history: [{ id: "h-7", at: daysAgo(0, 9), actorId: null, summary: "Richiesta ricevuta dal sito" }],
    }),
    base({
      id: "r-1003",
      reference: "AUR-DEMO-1003",
      createdAt: daysAgo(5),
      updatedAt: daysAgo(2),
      status: "consulenza",
      solution: "prestito-delega",
      workCategory: "dipendente-privato",
      amount: 12000,
      durationMonths: 72,
      contact: {
        fullName: "Sara Moretti",
        email: "s.moretti@esempio.invalid",
        phone: "000 0000003",
        preference: "telefono",
        timeSlot: "indifferente",
      },
      assigneeId: "u-con-2",
      notes: [
        {
          id: "n-3",
          authorId: "u-con-2",
          createdAt: daysAgo(2, 10),
          body: "Ha già una cessione del quinto attiva. Da verificare se il datore di lavoro accetta deleghe.",
        },
      ],
      history: [
        { id: "h-8", at: daysAgo(5), actorId: null, summary: "Richiesta ricevuta dal sito" },
        { id: "h-9", at: daysAgo(4), actorId: "u-adm-1", summary: "Assegnata a Elena Sarti" },
        { id: "h-10", at: daysAgo(2), actorId: "u-con-2", summary: "Stato: Nuova → Consulenza" },
      ],
    }),
    base({
      id: "r-1004",
      reference: "AUR-DEMO-1004",
      kind: "consulenza",
      createdAt: daysAgo(1, 18),
      updatedAt: daysAgo(1, 18),
      solution: "prestito-personale",
      workCategory: null,
      amount: null,
      durationMonths: null,
      contact: {
        fullName: "Luca Bianchi",
        email: "l.bianchi@esempio.invalid",
        phone: "000 0000004",
        preference: null,
        timeSlot: "pomeriggio",
      },
      booking: { mode: "videochiamata", days: ["mar", "gio"], timeSlot: "pomeriggio" },
      message: "Vorrei parlare di un prestito per lavori in casa.",
      history: [{ id: "h-11", at: daysAgo(1, 18), actorId: null, summary: "Prenotazione consulenza ricevuta dal sito" }],
    }),
    base({
      id: "r-1005",
      reference: "AUR-DEMO-1005",
      kind: "contatto",
      createdAt: daysAgo(2, 14),
      updatedAt: daysAgo(2, 14),
      status: "contattato",
      solution: null,
      workCategory: null,
      amount: null,
      durationMonths: null,
      topic: "informazioni",
      contact: { fullName: "Chiara Romano", email: "c.romano@esempio.invalid", phone: null, preference: null, timeSlot: null },
      message: "Lavoro con contratto a tempo determinato: posso comunque chiedere informazioni?",
      assigneeId: "u-con-2",
      history: [
        { id: "h-12", at: daysAgo(2, 14), actorId: null, summary: "Messaggio ricevuto dal modulo contatti" },
        { id: "h-13", at: daysAgo(1, 9), actorId: "u-con-2", summary: "Presa in carico da Elena Sarti" },
        { id: "h-14", at: daysAgo(1, 9), actorId: "u-con-2", summary: "Stato: Nuova → Primo contatto" },
      ],
    }),
    base({
      id: "r-1006",
      reference: "AUR-DEMO-1006",
      createdAt: daysAgo(30),
      updatedAt: daysAgo(6),
      status: "valutazione",
      solution: "cessione-quinto",
      workCategory: "pensionato",
      amount: 22000,
      durationMonths: 120,
      contact: {
        fullName: "Roberto Esposito",
        email: "r.esposito@esempio.invalid",
        phone: "000 0000006",
        preference: "telefono",
        timeSlot: "mattina",
      },
      assigneeId: "u-con-1",
      history: [
        { id: "h-15", at: daysAgo(30), actorId: null, summary: "Richiesta ricevuta dal sito" },
        { id: "h-16", at: daysAgo(6), actorId: "u-con-1", summary: "Stato: Raccolta documenti → In valutazione" },
      ],
    }),
    base({
      id: "r-1007",
      reference: "AUR-DEMO-1007",
      createdAt: daysAgo(45),
      updatedAt: daysAgo(20),
      status: "non-proseguita",
      solution: "prestito-personale",
      workCategory: "altro",
      amount: 5000,
      durationMonths: 36,
      contact: {
        fullName: "Davide Marino",
        email: "d.marino@esempio.invalid",
        phone: "000 0000007",
        preference: "email",
        timeSlot: "indifferente",
      },
      assigneeId: "u-con-2",
      history: [
        { id: "h-17", at: daysAgo(45), actorId: null, summary: "Richiesta ricevuta dal sito" },
        { id: "h-18", at: daysAgo(20), actorId: "u-con-2", summary: "Stato: Consulenza → Non proseguita (scelta del cliente)" },
      ],
    }),
    // Finanziamenti erogati: alimentano rinnovi e cruscotto. Condizioni inventate, solo dimostrative.
    base({
      id: "r-1008",
      reference: "AUR-DEMO-1008",
      createdAt: daysAgo(960),
      updatedAt: daysAgo(900),
      status: "conclusa",
      workCategory: "dipendente-pubblico",
      amount: 25000,
      durationMonths: 60,
      contact: { fullName: "Teresa Longo", email: "t.longo@esempio.invalid", phone: "000 0000008", preference: "telefono", timeSlot: "mattina" },
      marketingConsent: true,
      assigneeId: "u-con-1",
      firstContactAt: daysAgo(959),
      contract: { disbursedAt: daysAgo(900), amount: 25000, durationMonths: 60, lender: "Finanziatore dimostrativo", installment: null, renewalContactedAt: null },
      history: [{ id: "h-19", at: daysAgo(960), actorId: null, summary: "Richiesta ricevuta dal sito" }],
    }),
    base({
      id: "r-1009",
      reference: "AUR-DEMO-1009",
      createdAt: daysAgo(420),
      updatedAt: daysAgo(380),
      status: "conclusa",
      workCategory: "pensionato",
      amount: 14000,
      durationMonths: 84,
      contact: { fullName: "Franco Serra", email: "f.serra@esempio.invalid", phone: "000 0000009", preference: "telefono", timeSlot: "mattina" },
      assigneeId: "u-con-2",
      firstContactAt: daysAgo(419),
      channel: "convenzione-demo",
      contract: { disbursedAt: daysAgo(380), amount: 14000, durationMonths: 84, lender: "Finanziatore dimostrativo", installment: null, renewalContactedAt: null },
      history: [{ id: "h-20", at: daysAgo(420), actorId: null, summary: "Richiesta ricevuta dal sito" }],
    }),
  ];

  // Dati aggiuntivi delle pratiche dimostrative.
  const patch = (id: string, over: Partial<RequestRecord>) => Object.assign(requests.find((r) => r.id === id)!, over);
  patch("r-1001", { firstContactAt: daysAgo(10, 11), channel: "convenzione-demo" });
  patch("r-1002", {
    prequal: { contractType: null, seniority: null, employerSize: null, incomeBand: "1500-2000", existingLoans: "nessuno", ageBand: "66-70" },
  });
  patch("r-1003", {
    firstContactAt: daysAgo(2),
    prequal: { contractType: "indeterminato", seniority: "3-10", employerSize: "16-249", incomeBand: "1500-2000", existingLoans: "cessione-delega", ageBand: null },
  });
  patch("r-1005", { firstContactAt: daysAgo(1, 9) });
  patch("r-1006", { firstContactAt: daysAgo(29) });
  patch("r-1007", { firstContactAt: daysAgo(44) });

  const appointments: Appointment[] = [
    {
      id: "a-1",
      requestId: "r-1001",
      startsAt: daysAhead(3, 15, 30),
      mode: "telefono",
      status: "confermato",
      staffId: "u-con-1",
      note: "Verifica della documentazione ricevuta.",
    },
    { id: "a-0", requestId: "r-1001", startsAt: daysAgo(7, 15), mode: "videochiamata", status: "svolto", staffId: "u-con-1" },
    { id: "a-2", requestId: "r-1003", startsAt: daysAhead(1, 11), mode: "telefono", status: "confermato", staffId: "u-con-2" },
    { id: "a-3", requestId: "r-1004", startsAt: daysAhead(5, 17), mode: "videochiamata", status: "proposto", staffId: null },
  ];

  return { users, requests, appointments, notifications: [], closures: [], settings: defaultSettings(), seq: 1100 };
}

function defaultSettings(): Settings {
  // In demo si digitano spesso indirizzi di prova: le email ai clienti si attivano esplicitamente.
  return { autoAssign: false, clientEmails: !isDemo };
}

// ---------- Database ----------

type Runtime = Store & { sql: DatabaseSync };
const globalDb = globalThis as unknown as { __aurfinDb?: Runtime };

const SCHEMA = `
  PRAGMA journal_mode = WAL;
  PRAGMA busy_timeout = 5000;
  CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, role TEXT NOT NULL, email TEXT NOT NULL, doc TEXT NOT NULL);
  CREATE TABLE IF NOT EXISTS requests (
    id TEXT PRIMARY KEY, reference TEXT NOT NULL UNIQUE, kind TEXT NOT NULL, status TEXT NOT NULL,
    assignee_id TEXT, client_user_id TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL, doc TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS appointments (id TEXT PRIMARY KEY, request_id TEXT NOT NULL, starts_at TEXT NOT NULL, doc TEXT NOT NULL);
  CREATE TABLE IF NOT EXISTS notifications (id TEXT PRIMARY KEY, at TEXT NOT NULL, doc TEXT NOT NULL);
  CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY, value TEXT NOT NULL);
  -- Un orario, un solo appuntamento: la chiave primaria impedisce le doppie prenotazioni.
  CREATE TABLE IF NOT EXISTS slot_locks (starts_at TEXT PRIMARY KEY, appointment_id TEXT NOT NULL);
  CREATE TABLE IF NOT EXISTS closures (id TEXT PRIMARY KEY, doc TEXT NOT NULL);
  CREATE TABLE IF NOT EXISTS tokens (
    hash TEXT PRIMARY KEY, purpose TEXT NOT NULL, user_id TEXT NOT NULL, expires_at TEXT NOT NULL,
    used_at TEXT, attempts INTEGER NOT NULL DEFAULT 0, data TEXT
  );
  CREATE INDEX IF NOT EXISTS requests_client ON requests (client_user_id);
  CREATE INDEX IF NOT EXISTS requests_assignee ON requests (assignee_id);
`;

function databasePath() {
  const fallback = path.join(/* turbopackIgnore: true */ process.cwd(), "data", isDemo ? "aurfin-demo.db" : "aurfin.db");
  return path.resolve(process.env.DATABASE_PATH?.trim() || fallback);
}

function writeUser(sql: DatabaseSync, u: User) {
  sql.prepare("INSERT OR REPLACE INTO users (id, role, email, doc) VALUES (?, ?, ?, ?)").run(u.id, u.role, u.email.toLowerCase(), JSON.stringify(u));
}
function writeRequest(sql: DatabaseSync, r: RequestRecord) {
  sql
    .prepare(
      "INSERT OR REPLACE INTO requests (id, reference, kind, status, assignee_id, client_user_id, created_at, updated_at, doc) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
    )
    .run(r.id, r.reference, r.kind, r.status, r.assigneeId, r.clientUserId, r.createdAt, r.updatedAt, JSON.stringify(r));
}
function writeAppointment(sql: DatabaseSync, a: Appointment) {
  sql.prepare("INSERT OR REPLACE INTO appointments (id, request_id, starts_at, doc) VALUES (?, ?, ?, ?)").run(a.id, a.requestId, a.startsAt, JSON.stringify(a));
}
function writeMeta(sql: DatabaseSync, key: string, value: unknown) {
  sql.prepare("INSERT OR REPLACE INTO meta (key, value) VALUES (?, ?)").run(key, JSON.stringify(value));
}

function runtime(): Runtime {
  if (globalDb.__aurfinDb) return globalDb.__aurfinDb;

  const file = databasePath();
  mkdirSync(path.dirname(file), { recursive: true });
  const sql = new DatabaseSync(file);
  sql.exec(SCHEMA);

  const metaValue = <T,>(key: string): T | undefined => {
    const row = sql.prepare("SELECT value FROM meta WHERE key = ?").get(key) as { value: string } | undefined;
    return row ? (JSON.parse(row.value) as T) : undefined;
  };

  // Primo avvio: dati sintetici in demo, archivio vuoto in produzione.
  if (metaValue("initialized") === undefined) {
    const initial: Store = isDemo
      ? seed()
      : { users: [], requests: [], appointments: [], notifications: [], closures: [], settings: defaultSettings(), seq: 0 };
    sql.exec("BEGIN");
    initial.users.forEach((u) => writeUser(sql, u));
    initial.requests.forEach((r) => writeRequest(sql, r));
    initial.appointments.forEach((a) => writeAppointment(sql, a));
    writeMeta(sql, "settings", initial.settings);
    writeMeta(sql, "seq", initial.seq);
    writeMeta(sql, "initialized", new Date().toISOString());
    sql.exec("COMMIT");
  }

  const docs = <T,>(query: string) => (sql.prepare(query).all() as { doc: string }[]).map((row) => JSON.parse(row.doc) as T);
  const instance: Runtime = {
    sql,
    users: docs<User>("SELECT doc FROM users"),
    // Le righe salvate con versioni precedenti ricevono i campi nuovi.
    requests: docs<RequestRecord>("SELECT doc FROM requests ORDER BY created_at DESC").map((r) => ({ ...NEW_REQUEST_FIELDS, ...r })),
    appointments: docs<Appointment>("SELECT doc FROM appointments"),
    notifications: docs<NotificationLog>("SELECT doc FROM notifications ORDER BY at DESC"),
    closures: docs<Closure>("SELECT doc FROM closures"),
    settings: { ...defaultSettings(), ...metaValue<Partial<Settings>>("settings") },
    seq: metaValue<number>("seq") ?? 0,
  };

  // Demo esistenti: una tantum, gli appuntamenti sintetici futuri passano sulla griglia telefonica.
  if (isDemo && metaValue("plannerDemo") === undefined) {
    const nowMs = Date.now();
    const times = ["09:10", "10:30", "11:40", "15:00", "16:10"];
    let day = romeDate(new Date(nowMs));
    const nextSlot = () => {
      do day = addDays(day, 1);
      while (!isWorkday(day));
      return romeToIso(day, times[Math.floor(Math.random() * times.length)]);
    };
    for (const a of instance.appointments) {
      if (new Date(a.startsAt).getTime() < nowMs) continue;
      a.startsAt = nextSlot();
      a.mode = "telefono";
      if (a.status === "proposto") a.status = "confermato";
      writeAppointment(sql, a);
      const r = instance.requests.find((x) => x.id === a.requestId);
      if (r?.booking) {
        r.booking = { mode: "telefono", startsAt: a.startsAt };
        writeRequest(sql, r);
      }
    }
    writeMeta(sql, "plannerDemo", true);
  }

  // Gli appuntamenti attivi occupano il proprio orario.
  for (const a of instance.appointments) {
    if (a.status === "annullato") continue;
    sql.prepare("INSERT OR IGNORE INTO slot_locks (starts_at, appointment_id) VALUES (?, ?)").run(a.startsAt, a.id);
  }

  // Primo amministratore in produzione: imposterà la password dal recupero credenziali.
  const adminEmail = process.env.TEAM_ADMIN_EMAIL?.trim().toLowerCase();
  if (adminEmail && !instance.users.some((u) => u.role !== "cliente")) {
    const admin: User = { id: newId("u"), role: "amministratore", name: process.env.TEAM_ADMIN_NAME?.trim() || "Amministratore", email: adminEmail, active: true };
    instance.users.push(admin);
    writeUser(sql, admin);
  }

  globalDb.__aurfinDb = instance;
  return instance;
}

/** Accesso ai dati: il database si apre al primo utilizzo, non durante la build. */
export const db = {
  get users() {
    return runtime().users;
  },
  get requests() {
    return runtime().requests;
  },
  get appointments() {
    return runtime().appointments;
  },
  get notifications() {
    return runtime().notifications;
  },
  get closures() {
    return runtime().closures;
  },
  get settings() {
    return runtime().settings;
  },
};

export function sqlConnection() {
  return runtime().sql;
}

export function saveRequest(r: RequestRecord) {
  writeRequest(runtime().sql, r);
}
export function saveUser(u: User) {
  writeUser(runtime().sql, u);
}
export function saveAppointment(a: Appointment) {
  writeAppointment(runtime().sql, a);
}
/** Occupa un orario in modo atomico: restituisce false se è già preso. */
export function acquireSlot(startsAt: string, appointmentId: string) {
  const result = runtime().sql
    .prepare("INSERT OR IGNORE INTO slot_locks (starts_at, appointment_id) VALUES (?, ?)")
    .run(startsAt, appointmentId);
  return Number(result.changes) === 1;
}
export function releaseSlot(startsAt: string, appointmentId: string) {
  runtime().sql.prepare("DELETE FROM slot_locks WHERE starts_at = ? AND appointment_id = ?").run(startsAt, appointmentId);
}
export function occupiedSlots() {
  const rows = runtime().sql.prepare("SELECT starts_at FROM slot_locks").all() as { starts_at: string }[];
  return new Set(rows.map((row) => row.starts_at));
}
export function insertClosure(closure: Closure) {
  const rt = runtime();
  rt.closures.push(closure);
  rt.sql.prepare("INSERT OR REPLACE INTO closures (id, doc) VALUES (?, ?)").run(closure.id, JSON.stringify(closure));
}
export function deleteClosure(id: string) {
  const rt = runtime();
  rt.closures = rt.closures.filter((c) => c.id !== id);
  rt.sql.prepare("DELETE FROM closures WHERE id = ?").run(id);
}
export function saveSettings(next: Partial<Settings>) {
  const rt = runtime();
  Object.assign(rt.settings, next);
  writeMeta(rt.sql, "settings", rt.settings);
}
export function saveNotification(n: NotificationLog) {
  const rt = runtime();
  rt.notifications.unshift(n);
  rt.notifications.splice(500); // registro limitato agli ultimi 500 tentativi
  rt.sql.prepare("INSERT OR REPLACE INTO notifications (id, at, doc) VALUES (?, ?, ?)").run(n.id, n.at, JSON.stringify(n));
  rt.sql.prepare("DELETE FROM notifications WHERE id NOT IN (SELECT id FROM notifications ORDER BY at DESC LIMIT 500)").run();
}

export const newId = (prefix: string) => `${prefix}-${randomUUID().slice(0, 8)}`;

export function nextReference() {
  const rt = runtime();
  rt.seq += 1;
  writeMeta(rt.sql, "seq", rt.seq);
  return `AUR-${new Date().getFullYear()}-${String(rt.seq).padStart(5, "0")}`;
}

export function getUser(id: string) {
  return db.users.find((u) => u.id === id) ?? null;
}

export function findUserByEmail(email: string, scope: "cliente" | "team") {
  const target = email.trim().toLowerCase();
  return db.users.find((u) => u.email.toLowerCase() === target && (scope === "cliente" ? u.role === "cliente" : u.role !== "cliente")) ?? null;
}

export function listStaff() {
  return db.users.filter((u) => u.role !== "cliente");
}

export function listConsultants() {
  return db.users.filter((u) => u.role === "consulente" && u.active !== false);
}

