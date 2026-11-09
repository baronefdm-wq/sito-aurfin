import "server-only";
import { NextResponse, after } from "next/server";
import { notifyStaff, type NotifyEvent } from "@/lib/server/notifications";
import type { z } from "zod";
import { antispamSchema, fieldErrors } from "@/lib/schemas";
import { isDemo } from "@/lib/server/env";
import { clientIp, rateLimit } from "@/lib/server/rate-limit";
import { SlotUnavailableError } from "@/lib/server/repository";

/** Tempo minimo plausibile per compilare un modulo da parte di una persona. */
const MIN_FILL_MS = 2500;
const MAX_BODY_BYTES = 16 * 1024;

export type PublicSubmitResult = {
  reference: string;
  extra?: Record<string, unknown>;
  notify?: NotifyEvent;
  /** Lavoro dopo la risposta (es. email di conferma al cliente). */
  afterSave?: () => Promise<unknown>;
};

/**
 * Pipeline comune agli endpoint pubblici:
 * limite di frequenza → controllo dimensione → antispam → validazione Zod → salvataggio
 * → notifica al personale (dopo la risposta, senza rallentare l'utente).
 * All'esterno vengono inviati solo i dati minimi della notifica, sui canali configurati.
 */
export async function handlePublicSubmission<S extends z.ZodType>(
  request: Request,
  opts: {
    name: string;
    schema: S;
    save: (data: z.output<S>) => PublicSubmitResult;
  },
) {
  const ip = clientIp(request.headers);
  const limited = rateLimit(`${opts.name}:${ip}`, { limit: 5, windowMs: 10 * 60 * 1000 });
  if (!limited.ok) {
    return NextResponse.json(
      { error: "Hai inviato troppe richieste in poco tempo. Riprova tra qualche minuto." },
      { status: 429, headers: { "Retry-After": String(limited.retryAfter) } },
    );
  }

  const length = Number(request.headers.get("content-length") ?? 0);
  if (length > MAX_BODY_BYTES) {
    return NextResponse.json({ error: "Richiesta troppo grande." }, { status: 413 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Formato della richiesta non valido." }, { status: 400 });
  }

  const spam = antispamSchema.safeParse(body);
  if (!spam.success || Date.now() - spam.data.startedAt < MIN_FILL_MS) {
    // Risposta generica: non rivela il motivo del rifiuto.
    return NextResponse.json({ error: "Non è stato possibile inviare la richiesta. Riprova." }, { status: 400 });
  }

  const parsed = opts.schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Alcuni campi non sono corretti.", fields: fieldErrors(parsed.error) },
      { status: 422 },
    );
  }

  let saved: PublicSubmitResult;
  try {
    saved = opts.save(parsed.data);
  } catch (e) {
    if (e instanceof SlotUnavailableError) {
      return NextResponse.json({ error: e.message, code: "slot_unavailable", fields: { slot: e.message } }, { status: 409 });
    }
    throw e;
  }
  const { notify: event, afterSave } = saved;
  if (event) after(() => notifyStaff(event));
  if (afterSave) after(afterSave);
  return NextResponse.json({ reference: saved.reference, demo: isDemo, ...saved.extra }, { status: 201 });
}
