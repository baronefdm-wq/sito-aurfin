import "server-only";
import nodemailer from "nodemailer";
import { site } from "@/config/site";
import { buildInvite } from "@/lib/calendar-invite";
import { CALL_MINUTES, formatAppointment, romeDate } from "@/lib/scheduling";
import { db, newId, saveAppointment, saveNotification, type Appointment, type NotificationLog, type RequestRecord } from "@/lib/server/store";

/**
 * Notifiche interne al personale AURFIN per gli eventi del sito.
 *
 * Canali (si attivano solo se configurati in .env.local, mai nel codice):
 *  - Email via SMTP: NOTIFY_EMAIL_TO, SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM.
 *  - WhatsApp via WhatsApp Business Cloud API (Meta): NOTIFY_WHATSAPP_TO, WHATSAPP_TOKEN,
 *    WHATSAPP_PHONE_NUMBER_ID, WHATSAPP_TEMPLATE. I messaggi avviati dall'azienda richiedono
 *    un modello approvato da Meta con due variabili: {{1}} riepilogo, {{2}} link allo spazio team.
 *
 * Minimizzazione dei dati: WhatsApp riceve solo tipo di evento, codice e link; l'email
 * aggiunge il nome del richiedente. Documenti e recapiti non vengono mai inoltrati.
 * Ogni tentativo è registrato; se un canale non è configurato lo si dichiara, senza simulare invii.
 */

export type NotifyEvent = {
  type: "preventivo" | "contatto" | "consulenza" | "proposta" | "documenti" | "sollecito" | "rinnovo" | "prova";
  title: string;
  reference: string | null;
  requestId: string | null;
  /** Righe di dettaglio per l'email (WhatsApp usa solo titolo e link). */
  lines: string[];
};

const env = (k: string) => process.env[k]?.trim() || "";
const list = (k: string) =>
  env(k)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

export function emailConfig() {
  return {
    to: list("NOTIFY_EMAIL_TO"),
    host: env("SMTP_HOST"),
    port: Number(env("SMTP_PORT") || 587),
    user: env("SMTP_USER"),
    pass: env("SMTP_PASS"),
    from: env("SMTP_FROM") || env("SMTP_USER"),
  };
}

export function whatsappConfig() {
  return {
    to: list("NOTIFY_WHATSAPP_TO").map((n) => n.replace(/[^\d]/g, "")),
    token: env("WHATSAPP_TOKEN"),
    phoneNumberId: env("WHATSAPP_PHONE_NUMBER_ID"),
    template: env("WHATSAPP_TEMPLATE"),
    language: env("WHATSAPP_TEMPLATE_LANG") || "it",
    apiVersion: env("WHATSAPP_API_VERSION") || "v21.0",
  };
}

export function channelStatus() {
  const e = emailConfig();
  const w = whatsappConfig();
  return {
    // Con un utente SMTP serve anche la password: senza, il canale risulta non configurato.
    email: { configured: Boolean(e.to.length && e.host && e.from && (!e.user || e.pass)), recipients: e.to.map(maskEmail) },
    whatsapp: {
      configured: Boolean(w.to.length && w.token && w.phoneNumberId && w.template),
      recipients: w.to.map(maskPhone),
    },
  };
}

export function maskEmail(v: string) {
  const [user, domain] = v.split("@");
  return domain ? `${user.slice(0, 1)}•••@${domain}` : "•••";
}
export function maskPhone(v: string) {
  return v.length > 4 ? `+${v.slice(0, 2)} ••• ${v.slice(-4)}` : "•••";
}

/** Indirizzo nello spazio team: sul dominio dedicato se configurato (TEAM_HOST), altrimenti sul sito. */
export function teamUrl(pathname: string) {
  const teamHost = process.env.TEAM_HOST?.trim();
  return new URL(pathname, teamHost ? `https://${teamHost}` : site.url).toString();
}

function link(e: NotifyEvent) {
  return teamUrl(e.requestId ? `/team/pratiche/${e.requestId}` : "/team");
}

function log(entry: Omit<NotificationLog, "id" | "at">) {
  saveNotification({ ...entry, id: newId("nt"), at: new Date().toISOString() });
}

/** Invio SMTP configurato (indipendente dai destinatari delle notifiche interne). */
export function isMailReady() {
  const e = emailConfig();
  return Boolean(e.host && e.from && (!e.user || e.pass));
}

/** Indirizzi riservati dei dati dimostrativi: non si tenta mai la consegna. */
export function isDeliverable(address: string) {
  return !address.toLowerCase().endsWith(".invalid");
}

/** Invio di una singola email in testo semplice. Lancia un errore se fallisce. */
export async function sendMail(to: string, subject: string, text: string, icalEvent?: { method: string; content: string }) {
  const cfg = emailConfig();
  if (!isMailReady()) throw new Error("Invio email non configurato.");
  const transporter = nodemailer.createTransport({
    host: cfg.host,
    port: cfg.port,
    secure: cfg.port === 465,
    auth: cfg.user ? { user: cfg.user, pass: cfg.pass } : undefined,
  });
  await transporter.sendMail({ from: cfg.from, to, subject, text, ...(site.contacts.email ? { replyTo: site.contacts.email } : {}), ...(icalEvent ? { icalEvent: { ...icalEvent, filename: "telefonata.ics" } } : {}) });
}

/** Email di accesso (link o codice): sempre inviata. Nel registro non finisce mai il contenuto. */
export async function sendAccessEmail(to: string, subject: string, text: string, title: string) {
  const base = { event: "accesso", title, channel: "email" as const, requestId: null, recipient: maskEmail(to) };
  try {
    await sendMail(to, subject, text);
    log({ ...base, status: "inviata", detail: title });
  } catch (err) {
    log({ ...base, status: "errore", detail: err instanceof Error ? err.message.slice(0, 200) : "Errore SMTP" });
    throw err;
  }
}

/**
 * Email al cliente: rispetta l'impostazione del team e registra l'esito senza salvare il testo.
 * Restituisce null se è partita, altrimenti il motivo del mancato invio.
 */
export async function sendClientEmail(input: { to: string; subject: string; text: string; event: string; title: string; requestId: string }): Promise<string | null> {
  const base = { event: input.event, title: input.title, channel: "email" as const, requestId: input.requestId, recipient: maskEmail(input.to) };
  const skip = (status: "disattivata" | "non-configurata", detail: string) => {
    log({ ...base, status, detail });
    return detail;
  };
  if (!db.settings.clientEmails) return skip("disattivata", "Email ai clienti disattivate nelle impostazioni.");
  if (!isDeliverable(input.to)) return skip("disattivata", "Indirizzo dimostrativo: email non inviata.");
  if (!isMailReady()) return skip("non-configurata", "Invio email non configurato (SMTP_*).");
  try {
    await sendMail(input.to, input.subject, input.text);
    log({ ...base, status: "inviata", detail: input.subject });
    return null;
  } catch (err) {
    const detail = err instanceof Error ? err.message.slice(0, 200) : "Errore SMTP";
    log({ ...base, status: "errore", detail });
    return detail;
  }
}

/** Indirizzo il cui calendario riceve le telefonate (CALENDAR_INVITE_TO). Vuoto = nessun invio. */
export function calendarInviteTo() {
  return env("CALENDAR_INVITE_TO");
}

/**
 * Porta la telefonata sul calendario esterno con un invito via email.
 * Le pratiche d'esempio sono sempre escluse. Il telefono del cliente non esce:
 * si trova nello spazio team, tramite il link dell'evento.
 */
export async function syncAppointmentToCalendar(r: RequestRecord, appt: Appointment, action: "aggiorna" | "annulla") {
  const to = calendarInviteTo();
  if (!to || r.synthetic) return;
  const base = { event: "calendario", title: `Calendario: telefonata ${action === "annulla" ? "annullata" : "aggiornata"}`, channel: "email" as const, requestId: r.id, recipient: maskEmail(to) };
  if (!isMailReady()) return log({ ...base, status: "non-configurata", detail: "Invio email non configurato (SMTP_*)." });
  const sequence = (appt.calendarSequence ?? -1) + 1;
  appt.calendarSequence = sequence;
  saveAppointment(appt);
  const method = action === "annulla" ? "CANCEL" : "REQUEST";
  const link = teamUrl(`/team/planner?settimana=${romeDate(appt.startsAt)}&appuntamento=${appt.id}`);
  const summary = `Telefonata AURFIN: ${r.contact.fullName}`;
  const description = `Richiesta ${r.reference}\nApri nello spazio team: ${link}`;
  const content = buildInvite({
    appointmentId: appt.id,
    startsAt: appt.startsAt,
    durationMinutes: CALL_MINUTES,
    sequence,
    method,
    summary,
    description,
    organizer: emailConfig().user || "noreply@invalid",
    attendee: to,
  });
  const subject = `${action === "annulla" ? "Annullata" : "Telefonata"}: ${r.contact.fullName}, ${formatAppointment(appt.startsAt)}`;
  try {
    await sendMail(to, subject, `${summary}\n${formatAppointment(appt.startsAt)}\n${description}`, { method, content });
    log({ ...base, status: "inviata", detail: "Invito di calendario inviato." });
  } catch (err) {
    log({ ...base, status: "errore", detail: err instanceof Error ? err.message.slice(0, 200) : "Errore SMTP" });
  }
}

async function sendEmail(e: NotifyEvent) {
  const cfg = emailConfig();
  const base = { event: e.type, title: e.title, channel: "email" as const, requestId: e.requestId };
  if (!channelStatus().email.configured) {
    log({ ...base, recipient: "—", status: "non-configurata", detail: "Email non configurata (NOTIFY_EMAIL_TO, SMTP_*)." });
    return;
  }
  const subject = `[AURFIN] ${e.title}${e.reference ? ` – ${e.reference}` : ""}`;
  const text = [...e.lines, "", `Apri nello spazio team: ${link(e)}`, "", "Notifica automatica del sito AURFIN."].join("\n");
  for (const to of cfg.to) {
    try {
      await sendMail(to, subject, text);
      log({ ...base, recipient: maskEmail(to), status: "inviata", detail: subject });
    } catch (err) {
      log({ ...base, recipient: maskEmail(to), status: "errore", detail: err instanceof Error ? err.message.slice(0, 200) : "Errore SMTP" });
    }
  }
}

async function sendWhatsApp(e: NotifyEvent) {
  const cfg = whatsappConfig();
  const base = { event: e.type, title: e.title, channel: "whatsapp" as const, requestId: e.requestId };
  if (!channelStatus().whatsapp.configured) {
    log({
      ...base,
      recipient: "—",
      status: "non-configurata",
      detail: "WhatsApp non configurato (NOTIFY_WHATSAPP_TO, WHATSAPP_TOKEN, WHATSAPP_PHONE_NUMBER_ID, WHATSAPP_TEMPLATE).",
    });
    return;
  }
  const summary = `${e.title}${e.reference ? ` ${e.reference}` : ""}`;
  for (const to of cfg.to) {
    try {
      const res = await fetch(`https://graph.facebook.com/${cfg.apiVersion}/${cfg.phoneNumberId}/messages`, {
        method: "POST",
        headers: { Authorization: `Bearer ${cfg.token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to,
          type: "template",
          template: {
            name: cfg.template,
            language: { code: cfg.language },
            components: [
              {
                type: "body",
                parameters: [
                  { type: "text", text: summary },
                  { type: "text", text: link(e) },
                ],
              },
            ],
          },
        }),
        signal: AbortSignal.timeout(10_000),
      });
      if (res.ok) log({ ...base, recipient: maskPhone(to), status: "inviata", detail: summary });
      else {
        const body = (await res.json().catch(() => ({}))) as { error?: { message?: string } };
        log({ ...base, recipient: maskPhone(to), status: "errore", detail: body.error?.message?.slice(0, 200) ?? `HTTP ${res.status}` });
      }
    } catch (err) {
      log({ ...base, recipient: maskPhone(to), status: "errore", detail: err instanceof Error ? err.message.slice(0, 200) : "Errore di rete" });
    }
  }
}

/** Invia su tutti i canali; non lancia mai eccezioni (le notifiche non devono bloccare il sito). */
export async function notifyStaff(e: NotifyEvent) {
  await Promise.allSettled([sendEmail(e), sendWhatsApp(e)]);
}

export function listNotifications() {
  return db.notifications;
}
