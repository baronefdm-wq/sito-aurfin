/** Invio JSON verso gli endpoint pubblici con gestione esplicita degli esiti. */
export type SubmitOutcome =
  | { ok: true; reference: string; demo: boolean; extra: Record<string, unknown> }
  | { ok: false; message: string; fields?: Record<string, string> };

export async function submitJson(url: string, payload: unknown): Promise<SubmitOutcome> {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = (await res.json().catch(() => ({}))) as {
      reference?: string;
      demo?: boolean;
      error?: string;
      fields?: Record<string, string>;
      [key: string]: unknown;
    };
    if (res.ok && data.reference) return { ok: true, reference: data.reference, demo: Boolean(data.demo), extra: data };
    return {
      ok: false,
      message: data.error ?? "Non è stato possibile inviare la richiesta. Riprova tra qualche istante.",
      fields: data.fields,
    };
  } catch {
    return {
      ok: false,
      message: "Connessione non riuscita. Controlla la rete e riprova: i dati inseriti non sono andati persi.",
    };
  }
}
