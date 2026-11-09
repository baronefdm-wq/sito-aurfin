import "server-only";

/**
 * Limitatore a finestra scorrevole in memoria, per singola istanza.
 * In produzione con più istanze sostituirlo con un archivio condiviso (es. Redis)
 * mantenendo la stessa firma.
 */
type Bucket = { hits: number[] };
const globalStore = globalThis as unknown as { __aurfinRate?: Map<string, Bucket> };
const buckets: Map<string, Bucket> = (globalStore.__aurfinRate ??= new Map());

export function rateLimit(key: string, { limit, windowMs }: { limit: number; windowMs: number }) {
  const now = Date.now();
  const bucket = buckets.get(key) ?? { hits: [] };
  bucket.hits = bucket.hits.filter((t) => now - t < windowMs);
  if (bucket.hits.length >= limit) {
    buckets.set(key, bucket);
    const retryAfter = Math.ceil((windowMs - (now - bucket.hits[0])) / 1000);
    return { ok: false as const, retryAfter };
  }
  bucket.hits.push(now);
  buckets.set(key, bucket);
  return { ok: true as const };
}

export function clientIp(headers: Headers) {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return headers.get("x-real-ip") ?? "local";
}
