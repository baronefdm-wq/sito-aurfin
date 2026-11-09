import { z } from "zod";
import {
  AGE_BANDS,
  AMOUNT_RANGE,
  CONTRACT_TYPES,
  EMPLOYER_SIZES,
  EXISTING_LOANS,
  INCOME_BANDS,
  SENIORITY_BANDS,
  DURATION_OPTIONS,
  SOLUTION_KEYS,
  WORK_CATEGORY_KEYS,
} from "@/lib/domain";

/**
 * Schemi condivisi: lo stesso schema valida il modulo nel browser e la
 * richiesta sul server. I messaggi sono pensati per essere letti da chiunque.
 */

// Messaggi predefiniti in italiano per i casi non coperti da messaggi espliciti.
z.config(z.locales.it());

const keysOf = <T extends Record<string, unknown>>(o: T) => Object.keys(o) as [keyof T & string, ...(keyof T & string)[]];

const name = (label: string) =>
  z
    .string()
    .trim()
    .min(2, `Inserisci ${label} (almeno 2 caratteri).`)
    .max(60, `${label[0].toUpperCase()}${label.slice(1)} è troppo lungo.`)
    .regex(/^[\p{L}' .-]+$/u, `Usa solo lettere, spazi, apostrofi o trattini.`);

const email = z.string().trim().max(120, "L'indirizzo email è troppo lungo.").pipe(z.email("Controlla l'indirizzo email: ad esempio nome@dominio.it."));

const phone = z
  .string()
  .trim()
  .transform((v) => v.replace(/[\s.()-]/g, ""))
  .pipe(z.string().regex(/^\+?\d{6,15}$/, "Inserisci un numero di telefono valido, ad esempio 333 1234567."));

const privacyAck = z.boolean().refine((v) => v === true, {
  message: "Per procedere conferma di aver letto l'informativa privacy.",
});

const optionalChoice = <T extends Record<string, string>>(options: T) =>
  z.union([z.literal(""), z.enum(keysOf(options))]).optional().default("");

/** Campi antispam: honeypot vuoto e tempo minimo di compilazione. */
export const antispamSchema = z.object({
  website: z.string().max(0).optional().default(""),
  startedAt: z.number().int().positive(),
});

export const quoteSchema = z.object({
  solution: z.enum(SOLUTION_KEYS, { error: "Scegli una delle opzioni." }),
  workCategory: z.enum(WORK_CATEGORY_KEYS, { error: "Indica la tua situazione lavorativa." }),
  amount: z
    .number({ error: "Indica un importo." })
    .int()
    .min(AMOUNT_RANGE.min, `L'importo minimo indicabile è ${AMOUNT_RANGE.min.toLocaleString("it-IT")} €.`)
    .max(AMOUNT_RANGE.max, `Per importi superiori a ${AMOUNT_RANGE.max.toLocaleString("it-IT")} € scrivici via email.`),
  durationMonths: z
    .number({ error: "Indica una durata." })
    .refine((v) => (DURATION_OPTIONS as readonly number[]).includes(v), "Scegli una delle durate proposte."),
  firstName: name("il nome"),
  lastName: name("il cognome"),
  email,
  phone,
  message: z.string().trim().max(800, "Il messaggio può contenere al massimo 800 caratteri.").optional().default(""),
  // Pre-qualifica facoltativa: nessun campo è obbligatorio.
  contractType: optionalChoice(CONTRACT_TYPES),
  seniority: optionalChoice(SENIORITY_BANDS),
  employerSize: optionalChoice(EMPLOYER_SIZES),
  incomeBand: optionalChoice(INCOME_BANDS),
  existingLoans: optionalChoice(EXISTING_LOANS),
  ageBand: optionalChoice(AGE_BANDS),
  // Codice di provenienza non personale (link ?canale=).
  channel: z.string().trim().regex(/^[a-z0-9-]{0,40}$/).optional().default(""),
  agentInfoAck: z.boolean().optional().default(false),
  privacyAck,
  marketingConsent: z.boolean().default(false),
});
export type QuoteInput = z.input<typeof quoteSchema>;
export type QuoteData = z.output<typeof quoteSchema>;

/** Campi validati a ogni passaggio del percorso di richiesta. */
export const quoteSteps = [
  { id: "soluzione", title: "Soluzione", fields: ["solution"] },
  {
    id: "lavoro",
    title: "Situazione lavorativa",
    fields: ["workCategory", "contractType", "seniority", "employerSize", "incomeBand", "existingLoans", "ageBand"],
  },
  { id: "importo", title: "Importo e durata", fields: ["amount", "durationMonths"] },
  {
    id: "recapiti",
    title: "Recapiti",
    fields: ["firstName", "lastName", "email", "phone", "message"],
  },
  { id: "documenti", title: "Documenti (facoltativi)", fields: [] },
  { id: "riepilogo", title: "Riepilogo e invio", fields: ["privacyAck", "marketingConsent"] },
] as const satisfies { id: string; title: string; fields: readonly (keyof QuoteInput)[] }[];

/** Prenotazione dal link nell'email: nome, email e consenso sono già nella pratica. */
export const bookingSchema = z.object({
  phone,
  slot: z.string({ error: "Scegli giorno e orario della telefonata." }).trim().min(1, "Scegli giorno e orario della telefonata.").max(40),
  notes: z.string().trim().max(800, "Le note possono contenere al massimo 800 caratteri.").optional().default(""),
});
export type BookingInput = z.input<typeof bookingSchema>;
export type BookingData = z.output<typeof bookingSchema>;

/** Converte gli errori Zod in una mappa campo → messaggio. */
export function fieldErrors(error: z.ZodError) {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".");
    if (key && !out[key]) out[key] = issue.message;
  }
  return out;
}
