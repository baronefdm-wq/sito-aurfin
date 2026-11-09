import "server-only";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

/**
 * Storage privato dei documenti.
 *
 * Driver "local": file su disco in una cartella NON servita dal web
 * (predefinita: ./storage/private, esclusa da git). Attivo di default in
 * sviluppo; in produzione va impostato esplicitamente oppure sostituito con
 * uno storage privato gestito (bucket non pubblico, cifratura a riposo,
 * URL firmati a scadenza breve, scansione antivirus) mantenendo `put` e `get`.
 */
const driver = process.env.STORAGE_DRIVER ?? (process.env.NODE_ENV === "production" ? "" : "local");
const baseDir = path.resolve(process.env.STORAGE_LOCAL_DIR ?? path.join(process.cwd(), "storage", "private"));

const KEY_PATTERN = /^\d{4}\/[0-9a-f-]{36}\.(pdf|jpg|jpeg|png)$/;

export function isStorageConfigured() {
  return driver === "local";
}

export async function putObject(bytes: Uint8Array, extension: string) {
  if (!isStorageConfigured()) throw new Error("Storage documenti non configurato.");
  const key = `${new Date().getFullYear()}/${randomUUID()}${extension}`;
  const target = path.join(baseDir, key);
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, bytes, { flag: "wx" });
  return key;
}

/** La chiave è generata dal server: si rifiuta qualsiasi altro formato (path traversal). */
function resolveKey(key: string) {
  if (!isStorageConfigured()) throw new Error("Storage documenti non configurato.");
  if (!KEY_PATTERN.test(key)) throw new Error("Chiave non valida.");
  const target = path.join(baseDir, key);
  if (!target.startsWith(baseDir + path.sep)) throw new Error("Chiave non valida.");
  return target;
}

export async function getObject(key: string) {
  return readFile(resolveKey(key));
}

export async function deleteObject(key: string) {
  await rm(resolveKey(key), { force: true });
}
