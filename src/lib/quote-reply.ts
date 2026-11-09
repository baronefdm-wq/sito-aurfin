/** Riga da sostituire nella bozza: finché c'è, il preventivo non parte. */
export const QUOTE_PLACEHOLDER = "[Scrivi qui il preventivo]";

export function quoteDraft(fullName: string, reference: string) {
  return `Gentile ${fullName},\n\ngrazie per la richiesta ${reference}. Ecco il preventivo:\n\n${QUOTE_PLACEHOLDER}`;
}
