import { NextResponse } from "next/server";
import { AuthorizationError } from "@/lib/server/auth";
import { clientIp, rateLimit } from "@/lib/server/rate-limit";
import { attachFromSite, getRequestForUpload } from "@/lib/server/repository";
import { parseUpload, storeUpload } from "@/lib/server/upload";
import { readUploadToken } from "@/lib/server/upload-token";

/**
 * Caricamento di un documento subito dopo l'invio del preventivo.
 * Autorizzato dal token restituito alla creazione della richiesta
 * (header X-Upload-Token), valido 30 minuti e solo per quella richiesta.
 */
export async function POST(request: Request) {
  const limited = rateLimit(`upload-sito:${clientIp(request.headers)}`, { limit: 30, windowMs: 10 * 60 * 1000 });
  if (!limited.ok) {
    return NextResponse.json({ error: "Troppi caricamenti in poco tempo. Riprova tra qualche minuto." }, { status: 429 });
  }

  const requestId = readUploadToken(request.headers.get("x-upload-token"));
  if (!requestId) {
    return NextResponse.json(
      { error: "Il tempo per allegare i documenti è scaduto. Potrai caricarli dall'area riservata." },
      { status: 401 },
    );
  }

  const parsed = await parseUpload(request);
  if (!parsed.ok) return parsed.response;

  try {
    getRequestForUpload(requestId, parsed.documentId);
    const stored = await storeUpload(parsed.file);
    if (!stored.ok) return stored.response;
    const att = attachFromSite(requestId, parsed.documentId, stored.input);
    return NextResponse.json({ id: att.id }, { status: 201 });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Caricamento non riuscito.";
    return NextResponse.json({ error: message }, { status: e instanceof AuthorizationError ? 403 : 422 });
  }
}
