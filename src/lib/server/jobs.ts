import "server-only";
import { notifyStaff } from "@/lib/server/notifications";
import { renewableAt } from "@/lib/server/repository";
import { deleteObject } from "@/lib/server/storage";
import { db, newId, saveRequest } from "@/lib/server/store";

/**
 * Attività periodiche (ogni ora, vedi src/instrumentation.ts):
 *  - sollecito al team per le richieste in attesa del primo contatto;
 *  - avviso per i finanziamenti diventati rinnovabili;
 *  - cancellazione dei documenti scaduti, solo se DOCUMENT_RETENTION_DAYS è impostata.
 * Le pratiche dimostrative sono escluse: non generano email né cancellazioni.
 */

export function firstContactHours() {
  const v = Number(process.env.FIRST_CONTACT_ALERT_HOURS);
  return Number.isFinite(v) && v > 0 ? v : 24;
}

/** Giorni di conservazione: nessun valore = nessuna cancellazione automatica. */
export function retentionDays() {
  const v = Number(process.env.DOCUMENT_RETENTION_DAYS);
  return Number.isFinite(v) && v > 0 ? v : null;
}

async function remindFirstContact(now: number) {
  const limit = firstContactHours() * 3_600_000;
  const late = db.requests.filter(
    (r) => !r.synthetic && r.status === "nuova" && !r.slaNotifiedAt && now - new Date(r.createdAt).getTime() > limit,
  );
  if (!late.length) return 0;
  late.forEach((r) => {
    r.slaNotifiedAt = new Date(now).toISOString();
    saveRequest(r);
  });
  await notifyStaff({
    type: "sollecito",
    title: `${late.length} ${late.length === 1 ? "richiesta attende" : "richieste attendono"} il primo contatto`,
    reference: late.length === 1 ? late[0].reference : null,
    requestId: late.length === 1 ? late[0].id : null,
    lines: [`In attesa da più di ${firstContactHours()} ore:`, ...late.map((r) => `- ${r.reference}`)],
  });
  return late.length;
}

async function remindRenewals(now: number) {
  const ready = db.requests.filter(
    (r) => !r.synthetic && r.contract && !r.renewalNotifiedAt && new Date(renewableAt(r.contract)).getTime() <= now,
  );
  if (!ready.length) return 0;
  ready.forEach((r) => {
    r.renewalNotifiedAt = new Date(now).toISOString();
    saveRequest(r);
  });
  await notifyStaff({
    type: "rinnovo",
    title: `${ready.length} ${ready.length === 1 ? "finanziamento potrebbe essere rinnovabile" : "finanziamenti potrebbero essere rinnovabili"}`,
    reference: ready.length === 1 ? ready[0].reference : null,
    requestId: ready.length === 1 ? ready[0].id : null,
    lines: ["Data stimata raggiunta, da verificare con il mandante:", ...ready.map((r) => `- ${r.reference}`)],
  });
  return ready.length;
}

/** Elenco dei documenti di pratiche chiuse oltre il termine di conservazione. */
export function expiredDocuments(now = Date.now()) {
  const days = retentionDays();
  if (!days) return [];
  const limit = days * 86_400_000;
  return db.requests.filter(
    (r) =>
      !r.synthetic &&
      r.attachments.length > 0 &&
      (r.status === "conclusa" || r.status === "non-proseguita") &&
      now - new Date(r.updatedAt).getTime() > limit,
  );
}

async function purgeDocuments(now: number) {
  let removed = 0;
  for (const r of expiredDocuments(now)) {
    const count = r.attachments.length;
    await Promise.all(r.attachments.map((a) => deleteObject(a.storageKey)));
    r.attachments = [];
    removed += count;
    // updatedAt resta invariato: la cancellazione non riapre il conteggio della pratica.
    r.history.unshift({
      id: newId("h"),
      at: new Date(now).toISOString(),
      actorId: null,
      summary: `Eliminati ${count} documenti per termine di conservazione`,
    });
    saveRequest(r);
  }
  return removed;
}

export async function runMaintenance() {
  const now = Date.now();
  const [reminded, renewals, purged] = [await remindFirstContact(now), await remindRenewals(now), await purgeDocuments(now)];
  return { reminded, renewals, purged };
}
