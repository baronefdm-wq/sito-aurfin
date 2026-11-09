import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { site } from "@/config/site";
import { getSessionSecret } from "@/lib/server/env";

/**
 * Link personale per prenotare la telefonata: si trova solo nell'email con il preventivo.
 * È firmato e legato a una pratica: chi non lo ha ricevuto non può prenotare.
 */
export const BOOKING_LINK_DAYS = 30;

const sign = (data: string) => createHmac("sha256", getSessionSecret()).update(`appuntamento:${data}`).digest("base64url");

export function createBookingToken(requestId: string) {
  const exp = Math.floor(Date.now() / 1000) + BOOKING_LINK_DAYS * 86_400;
  const data = Buffer.from(JSON.stringify({ id: requestId, exp })).toString("base64url");
  return `${data}.${sign(data)}`;
}

/** Restituisce la pratica collegata, oppure null se il link è falso o scaduto. */
export function readBookingToken(token: string): string | null {
  const [data, signature] = token.split(".");
  if (!data || !signature) return null;
  const expected = Buffer.from(sign(data));
  const given = Buffer.from(signature);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;
  try {
    const { id, exp } = JSON.parse(Buffer.from(data, "base64url").toString()) as { id?: unknown; exp?: unknown };
    if (typeof id !== "string" || typeof exp !== "number" || exp < Date.now() / 1000) return null;
    return id;
  } catch {
    return null;
  }
}

export function bookingUrl(requestId: string) {
  return new URL(`/appuntamento/${createBookingToken(requestId)}`, site.url).toString();
}
