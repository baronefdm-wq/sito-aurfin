import "server-only";
import { NextResponse } from "next/server";
import { DOCUMENT_RULES, extensionOf, validateDocument } from "@/lib/documents";
import type { AttachmentInput } from "@/lib/server/repository";
import { isStorageConfigured, putObject } from "@/lib/server/storage";

type Parsed = { ok: true; documentId: string; file: File } | { ok: false; response: NextResponse };

const fail = (status: number, error: string) => ({ ok: false as const, response: NextResponse.json({ error }, { status }) });

/** Legge e verifica la parte "file" di un multipart, senza ancora salvarla. */
export async function parseUpload(request: Request): Promise<Parsed> {
  if (!isStorageConfigured()) {
    return fail(503, "Il caricamento dei documenti non è attivo: lo storage privato non è configurato.");
  }
  const length = Number(request.headers.get("content-length") ?? 0);
  if (length > DOCUMENT_RULES.maxBytes + 64 * 1024) return fail(413, "Il file supera la dimensione massima di 10 MB.");

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return fail(400, "Formato della richiesta non valido.");
  }
  const file = form.get("file");
  const documentId = String(form.get("documentId") ?? "");
  if (!(file instanceof File)) return fail(400, "Nessun file ricevuto.");
  if (!/^[a-z0-9-]{2,40}$/.test(documentId)) return fail(400, "Documento non valido.");
  const precheck = validateDocument(file);
  if (precheck) return fail(422, precheck);
  return { ok: true, documentId, file };
}

/** Verifica il contenuto reale del file e lo scrive nello storage privato. */
export async function storeUpload(file: File): Promise<{ ok: true; input: AttachmentInput } | { ok: false; response: NextResponse }> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const error = validateDocument({ name: file.name, size: bytes.byteLength, type: file.type }, bytes.subarray(0, 8));
  if (error) return fail(422, error);
  const ext = extensionOf(file.name) === ".jpeg" ? ".jpg" : extensionOf(file.name);
  const storageKey = await putObject(bytes, ext);
  // Nome originale ripulito: solo per la visualizzazione.
  const originalName = file.name.replace(/[^\p{L}\p{N} ._()-]/gu, "_").slice(0, 120);
  return { ok: true, input: { originalName, size: bytes.byteLength, mime: file.type, storageKey } };
}
