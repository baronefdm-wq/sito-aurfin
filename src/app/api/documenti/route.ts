import { NextResponse, after } from "next/server";
import { notifyStaff } from "@/lib/server/notifications";
import { clientDocumentEvent } from "@/lib/server/notify-events";
import { db } from "@/lib/server/store";
import { AuthorizationError, assertRole } from "@/lib/server/auth";
import { rateLimit } from "@/lib/server/rate-limit";
import { attachForClient, getClientRequestForUpload } from "@/lib/server/repository";
import { parseUpload, storeUpload } from "@/lib/server/upload";

/** Caricamento documenti dall'area riservata: solo il cliente, solo sulla propria pratica. */
export async function POST(request: Request) {
  let viewer;
  try {
    viewer = await assertRole(["cliente"]);
  } catch (e) {
    if (e instanceof AuthorizationError) return NextResponse.json({ error: "Accesso non autorizzato." }, { status: 401 });
    throw e;
  }
  if (!rateLimit(`upload-cliente:${viewer.id}`, { limit: 30, windowMs: 10 * 60 * 1000 }).ok) {
    return NextResponse.json({ error: "Troppi caricamenti in poco tempo. Riprova tra qualche minuto." }, { status: 429 });
  }

  const parsed = await parseUpload(request);
  if (!parsed.ok) return parsed.response;

  try {
    getClientRequestForUpload(viewer, parsed.documentId);
    const stored = await storeUpload(parsed.file);
    if (!stored.ok) return stored.response;
    const att = attachForClient(viewer, parsed.documentId, stored.input);
    // Notifica al personale dopo la risposta (la pratica è già stata verificata sopra).
    const r = db.requests.find((x) => x.clientUserId === viewer.id);
    const doc = r?.documents.find((d) => d.id === parsed.documentId);
    if (r && doc) after(() => notifyStaff(clientDocumentEvent(r, doc.label)));
    return NextResponse.json({ id: att.id }, { status: 201 });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Caricamento non riuscito.";
    return NextResponse.json({ error: message }, { status: e instanceof AuthorizationError ? 403 : 422 });
  }
}
