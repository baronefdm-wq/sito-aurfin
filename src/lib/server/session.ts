import { createHmac, timingSafeEqual } from "node:crypto";
import type { Role } from "@/lib/domain";

/**
 * Sessione firmata (HMAC-SHA256) in cookie httpOnly.
 * Usata dalla demo; con un provider di autenticazione reale questo modulo
 * va sostituito mantenendo `readSessionToken` / `createSessionToken`.
 */
/**
 * Due spazi separati con sessioni indipendenti: area clienti e spazio team.
 * Una sessione del team non apre l'area clienti e viceversa.
 */
export type Space = "cliente" | "team";
export const SESSION_COOKIES: Record<Space, string> = { cliente: "aurfin_cliente", team: "aurfin_team" };
export const SESSION_TTL_SECONDS = 60 * 60 * 8;

export function spaceForRole(role: Role): Space {
  return role === "cliente" ? "cliente" : "team";
}

/** `v` è la versione di sessione dell'utente: cambiandola, le sessioni aperte decadono. */
export type SessionPayload = { uid: string; role: Role; v: number; exp: number };

const b64 = (s: string) => Buffer.from(s).toString("base64url");

function sign(data: string, secret: string) {
  return createHmac("sha256", secret).update(data).digest("base64url");
}

export function createSessionToken(payload: Omit<SessionPayload, "exp">, secret: string) {
  const full: SessionPayload = { ...payload, exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS };
  const data = b64(JSON.stringify(full));
  return `${data}.${sign(data, secret)}`;
}

export function readSessionToken(token: string | undefined, secret: string): SessionPayload | null {
  if (!token) return null;
  const [data, signature] = token.split(".");
  if (!data || !signature) return null;
  const expected = Buffer.from(sign(data, secret));
  const given = Buffer.from(signature);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;
  try {
    const payload = JSON.parse(Buffer.from(data, "base64url").toString()) as SessionPayload;
    if (typeof payload.exp !== "number" || payload.exp < Date.now() / 1000) return null;
    if (!["cliente", "consulente", "amministratore"].includes(payload.role)) return null;
    return payload;
  } catch {
    return null;
  }
}
