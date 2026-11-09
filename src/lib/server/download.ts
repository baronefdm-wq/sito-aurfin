import "server-only";
import { NextResponse } from "next/server";
import { AuthorizationError, getViewer } from "@/lib/server/auth";
import { getAttachmentForViewer } from "@/lib/server/repository";
import type { Space } from "@/lib/server/session";
import { getObject } from "@/lib/server/storage";

/**
 * Apertura di un documento. Il file non è mai raggiungibile direttamente:
 * ogni accesso passa dalla sessione dello spazio corrispondente e dai permessi
 * (cliente: solo i propri; team: pratiche visibili secondo il ruolo).
 */
export async function serveAttachment(space: Space, id: string) {
  const viewer = await getViewer(space);
  if (!viewer) return NextResponse.json({ error: "Accesso non autorizzato." }, { status: 401 });

  try {
    const att = getAttachmentForViewer(viewer, id);
    const bytes = await getObject(att.storageKey);
    return new NextResponse(new Uint8Array(bytes), {
      headers: {
        "Content-Type": att.mime,
        "Content-Length": String(bytes.byteLength),
        "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(att.originalName)}`,
        "Cache-Control": "private, no-store",
        // Tipo verificato anche sulla firma binaria al caricamento; nosniff impedisce reinterpretazioni.
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (e) {
    if (e instanceof AuthorizationError) return NextResponse.json({ error: "Documento non trovato." }, { status: 404 });
    return NextResponse.json({ error: "File non disponibile." }, { status: 404 });
  }
}
