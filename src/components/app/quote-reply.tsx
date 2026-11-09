"use client";

import { useActionState, useState } from "react";
import { Check, Copy, Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/form-controls";
import { Notice } from "@/components/ui/primitives";
import { sendQuoteReply, type QuoteReplyState } from "@/app/team/actions";

/** Risposta con il preventivo: il testo resta nel modulo anche se l'invio non riesce. */
export function QuoteReply({ requestId, email, draft, link, days }: { requestId: string; email: string; draft: string; link: string; days: number }) {
  const [body, setBody] = useState(draft);
  const [copied, setCopied] = useState(false);
  const [state, action, pending] = useActionState<QuoteReplyState, FormData>(async (previous, formData) => {
    const result = await sendQuoteReply(previous, formData);
    // Dopo l'invio torna la bozza: un secondo clic non può rispedire lo stesso preventivo.
    if (result?.ok) setBody(draft);
    return result;
  }, null);

  const copy = async () => {
    await navigator.clipboard.writeText(link);
    setCopied(true);
  };

  return (
    <div className="space-y-5">
      <form action={action} className="space-y-3">
        <input type="hidden" name="id" value={requestId} />
        <Label htmlFor="quote-body">Testo per {email}</Label>
        <Textarea id="quote-body" name="body" rows={9} required maxLength={6000} value={body} onChange={(e) => setBody(e.target.value)} />
        <p className="text-sm text-slate">
          In fondo all&apos;email aggiungiamo noi il link personale per prenotare la telefonata, valido {days} giorni, e i dati della società. Il testo resta nelle note interne.
        </p>
        {state ? (
          <Notice tone={state.ok ? "success" : "danger"} role={state.ok ? "status" : "alert"}>
            {state.message}
          </Notice>
        ) : null}
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? <Loader2 aria-hidden className="animate-spin" /> : <Send aria-hidden />}
          Invia il preventivo
        </Button>
      </form>

      <div className="border-t border-line pt-5">
        <Label htmlFor="booking-link">Scrivi da un&apos;altra casella? Copia il link per prenotare</Label>
        <div className="mt-1.5 flex gap-2">
          <Input id="booking-link" readOnly value={link} className="min-w-0 flex-1 text-sm" onFocus={(e) => e.target.select()} />
          <Button type="button" size="sm" variant="secondary" className="h-12 shrink-0" onClick={() => void copy()}>
            {copied ? <Check aria-hidden /> : <Copy aria-hidden />}
            <span aria-live="polite">{copied ? "Copiato" : "Copia"}</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
