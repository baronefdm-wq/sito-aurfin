import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { getSessionSecret } from "@/lib/server/env";

/**
 * Token monouso-per-richiesta che autorizza il caricamento di documenti
 * subito dopo l'invio del preventivo, senza account. Legato all'id della
 * richiesta e valido 30 minuti.
 */
const TTL_SECONDS = 30 * 60;

const sign = (data: string) => createHmac("sha256", getSessionSecret()).update(`upload:${data}`).digest("base64url");

export function createUploadToken(requestId: string) {
  const data = Buffer.from(JSON.stringify({ rid: requestId, exp: Math.floor(Date.now() / 1000) + TTL_SECONDS })).toString(
    "base64url",
  );
  return `${data}.${sign(data)}`;
}

export function readUploadToken(token: string | null | undefined): string | null {
  if (!token) return null;
  const [data, sig] = token.split(".");
  if (!data || !sig) return null;
  const a = Buffer.from(sign(data));
  const b = Buffer.from(sig);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const payload = JSON.parse(Buffer.from(data, "base64url").toString()) as { rid: string; exp: number };
    if (payload.exp < Date.now() / 1000) return null;
    return payload.rid;
  } catch {
    return null;
  }
}
