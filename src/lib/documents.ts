/**
 * Regole per il caricamento documenti, condivise tra interfaccia e server.
 * Il server ripete sempre tutti i controlli: quelli nel browser servono solo
 * a dare un riscontro immediato.
 */
export const DOCUMENT_RULES = {
  maxBytes: 10 * 1024 * 1024,
  maxFilesPerSlot: 3,
  maxFilesPerRequest: 20,
  allowedMime: ["application/pdf", "image/jpeg", "image/png"] as const,
  allowedExtensions: [".pdf", ".jpg", ".jpeg", ".png"] as const,
  accept: ".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png",
};

/** Firme iniziali dei formati ammessi: il tipo dichiarato dal browser non basta. */
const MAGIC: Record<(typeof DOCUMENT_RULES.allowedMime)[number], number[]> = {
  "application/pdf": [0x25, 0x50, 0x44, 0x46],
  "image/jpeg": [0xff, 0xd8, 0xff],
  "image/png": [0x89, 0x50, 0x4e, 0x47],
};

export function extensionOf(name: string) {
  const dot = name.lastIndexOf(".");
  return dot >= 0 ? name.slice(dot).toLowerCase() : "";
}

export function validateDocument(file: { name: string; size: number; type: string }, head?: Uint8Array) {
  if (file.size <= 0) return "Il file è vuoto.";
  if (file.size > DOCUMENT_RULES.maxBytes) return "Il file supera la dimensione massima di 10 MB.";
  if (!(DOCUMENT_RULES.allowedExtensions as readonly string[]).includes(extensionOf(file.name))) {
    return "Formato non ammesso: usa PDF, JPG o PNG.";
  }
  if (!(DOCUMENT_RULES.allowedMime as readonly string[]).includes(file.type)) {
    return "Formato non ammesso: usa PDF, JPG o PNG.";
  }
  if (head) {
    const sig = MAGIC[file.type as keyof typeof MAGIC];
    if (!sig.every((b, i) => head[i] === b)) return "Il contenuto del file non corrisponde al formato dichiarato.";
  }
  return null;
}

export function formatBytes(n: number) {
  if (n < 1024 * 1024) return `${Math.max(1, Math.round(n / 1024))} KB`;
  return `${(n / 1024 / 1024).toFixed(1).replace(".", ",")} MB`;
}
