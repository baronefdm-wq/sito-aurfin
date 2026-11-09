import "server-only";
import { randomBytes } from "node:crypto";
import { isStorageConfigured } from "@/lib/server/storage";

/**
 * Configurazione lato server. Nessun valore qui viene esposto al browser.
 *
 * DATA_MODE
 *  - "demo" (predefinito): database separato con dati sintetici e profili
 *    dimostrativi senza password.
 *  - "live": database reale che parte vuoto, nessun profilo dimostrativo,
 *    accessi veri (personale: password e codice via email; clienti: link via email).
 *    Richiede SESSION_SECRET e, per gli accessi, l'invio email configurato.
 */
export const DATA_MODE: "demo" | "live" = process.env.DATA_MODE === "live" ? "live" : "demo";
export const isDemo = DATA_MODE === "demo";

const globalForSecret = globalThis as unknown as { __aurfinEphemeralSecret?: string };

export function getSessionSecret(): string {
  const configured = process.env.SESSION_SECRET;
  if (configured && configured.length >= 32) return configured;
  if (!isDemo) {
    throw new Error("SESSION_SECRET mancante o troppo corto (minimo 32 caratteri) in modalità live.");
  }
  // In demo: segreto effimero per processo, le sessioni scadono al riavvio.
  globalForSecret.__aurfinEphemeralSecret ??= randomBytes(32).toString("hex");
  return globalForSecret.__aurfinEphemeralSecret;
}

/** Stato delle integrazioni esterne, per README e checklist di pubblicazione. */
export function getIntegrationStatus() {
  return [
    {
      key: "database",
      label: "Database delle richieste",
      configured: true,
      note: "SQLite su disco (una sola istanza dell'app). Con più istanze serve un database di rete, es. PostgreSQL.",
    },
    {
      key: "auth",
      label: "Autenticazione utenti",
      configured: Boolean(process.env.SMTP_HOST),
      note: "Personale: password e codice via email. Clienti: link via email. Richiede l'invio email.",
    },
    {
      key: "storage",
      label: "Storage privato documenti",
      configured: isStorageConfigured(),
      note:
        process.env.STORAGE_DRIVER === "local" || (!process.env.STORAGE_DRIVER && process.env.NODE_ENV !== "production")
          ? "Attivo lo storage locale privato (solo per sviluppo e presentazione). In produzione: bucket privato con link temporanei e scansione antivirus."
          : "Bucket privato con link temporanei e scansione antivirus.",
    },
    {
      key: "notify-email",
      label: "Notifiche al personale via email",
      configured: Boolean(process.env.NOTIFY_EMAIL_TO && process.env.SMTP_HOST),
      note: "Avvisi per nuovi preventivi, telefonate prenotate e proposte (SMTP).",
    },
    {
      key: "notify-whatsapp",
      label: "Notifiche al personale via WhatsApp",
      configured: Boolean(process.env.NOTIFY_WHATSAPP_TO && process.env.WHATSAPP_TOKEN && process.env.WHATSAPP_TEMPLATE),
      note: "WhatsApp Business Cloud API con modello di messaggio approvato da Meta.",
    },
    {
      key: "email",
      label: "Email ai clienti",
      configured: Boolean(process.env.SMTP_HOST),
      note: "Conferme di ricezione, preventivi con il link per prenotare la telefonata e recupero credenziali.",
    },
    {
      key: "calendar",
      label: "Calendario esterno",
      configured: Boolean(process.env.CALENDAR_INVITE_TO && process.env.SMTP_HOST),
      note: "Invito di calendario via email per ogni telefonata prenotata, spostata o annullata.",
    },
  ];
}
