import "server-only";
import { createHash, randomBytes, randomInt, scrypt, timingSafeEqual } from "node:crypto";
import { sqlConnection } from "@/lib/server/store";

/**
 * Credenziali temporanee salvate solo come impronta (SHA-256):
 * - "accesso-cliente": link di accesso via email, 30 minuti, monouso;
 * - "password": invito o recupero password del personale, 1 ora, monouso;
 * - "codice": secondo fattore del personale, 10 minuti, massimo 5 tentativi.
 */
export type TokenPurpose = "accesso-cliente" | "password" | "codice";

const sha256 = (v: string) => createHash("sha256").update(v).digest("hex");
const nowIso = () => new Date().toISOString();

export function createToken(purpose: TokenPurpose, userId: string, ttlSeconds: number, data?: string) {
  const raw = randomBytes(32).toString("base64url");
  const sql = sqlConnection();
  sql.prepare("DELETE FROM tokens WHERE expires_at < ?").run(nowIso());
  // Un nuovo link o codice annulla i precedenti dello stesso tipo.
  sql.prepare("DELETE FROM tokens WHERE user_id = ? AND purpose = ? AND used_at IS NULL").run(userId, purpose);
  sql
    .prepare("INSERT INTO tokens (hash, purpose, user_id, expires_at, data) VALUES (?, ?, ?, ?, ?)")
    .run(sha256(raw), purpose, userId, new Date(Date.now() + ttlSeconds * 1000).toISOString(), data ?? null);
  return raw;
}

/** Verifica senza consumare (es. per mostrare il modulo). */
export function isTokenValid(raw: string, purpose: TokenPurpose) {
  const row = sqlConnection()
    .prepare("SELECT 1 FROM tokens WHERE hash = ? AND purpose = ? AND used_at IS NULL AND expires_at > ?")
    .get(sha256(raw), purpose, nowIso());
  return Boolean(row);
}

/** Consuma il token una sola volta e restituisce l'utente collegato. */
export function consumeToken(raw: string, purpose: TokenPurpose): string | null {
  const row = sqlConnection()
    .prepare("UPDATE tokens SET used_at = ? WHERE hash = ? AND purpose = ? AND used_at IS NULL AND expires_at > ? RETURNING user_id")
    .get(nowIso(), sha256(raw), purpose, nowIso()) as { user_id: string } | undefined;
  return row?.user_id ?? null;
}

/** Secondo fattore: restituisce la sfida (nel cookie) e il codice (via email). */
export function createLoginChallenge(userId: string) {
  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  const salt = randomBytes(16).toString("hex");
  const challenge = createToken("codice", userId, 10 * 60, `${salt}:${sha256(salt + code)}`);
  return { challenge, code };
}

export function verifyLoginChallenge(challenge: string, code: string): string | null {
  const sql = sqlConnection();
  const row = sql
    .prepare("SELECT user_id, attempts, data FROM tokens WHERE hash = ? AND purpose = 'codice' AND used_at IS NULL AND expires_at > ?")
    .get(sha256(challenge), nowIso()) as { user_id: string; attempts: number; data: string } | undefined;
  if (!row || row.attempts >= 5) return null;
  sql.prepare("UPDATE tokens SET attempts = attempts + 1 WHERE hash = ?").run(sha256(challenge));
  const [salt, expected] = row.data.split(":");
  const a = Buffer.from(sha256(salt + code.trim()));
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  return consumeToken(challenge, "codice");
}

// ---------- Password del personale ----------

const SCRYPT = { N: 32768, r: 8, p: 1, maxmem: 128 * 1024 * 1024 };

function derive(password: string, salt: string) {
  return new Promise<Buffer>((resolve, reject) =>
    scrypt(password, salt, 64, SCRYPT, (err, key) => (err ? reject(err) : resolve(key))),
  );
}

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  return `scrypt$${salt}$${(await derive(password, salt)).toString("hex")}`;
}

/** Senza hash si esegue comunque il calcolo: i tempi non rivelano se l'utente esiste. */
export async function verifyPassword(password: string, stored: string | undefined) {
  const [, salt, hash] = stored?.split("$") ?? [];
  const key = await derive(password, salt ?? "nessun-utente");
  if (!hash) return false;
  const expected = Buffer.from(hash, "hex");
  return expected.length === key.length && timingSafeEqual(expected, key);
}
