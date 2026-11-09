import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Notice } from "@/components/ui/primitives";

/** Conferma mostrata solo dopo una risposta positiva reale del server. */
export function SubmissionSuccess({
  title,
  reference,
  demo,
  children,
}: {
  title: string;
  reference: string;
  demo: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div role="status" className="animate-fade-up rounded-lg border border-line bg-white p-6 shadow-soft sm:p-10">
      <CheckCircle2 aria-hidden className="size-10 text-teal-700" strokeWidth={1.5} />
      <h2 className="mt-5 font-serif text-3xl text-navy-900">{title}</h2>
      <p className="mt-3 text-lg text-slate">
        Codice di riferimento: <strong className="font-semibold text-navy-900 tabular-nums">{reference}</strong>
      </p>
      <div className="mt-4 max-w-2xl space-y-3 leading-relaxed text-slate">{children}</div>
      {demo ? (
        <Notice tone="demo" title="Ambiente dimostrativo" className="mt-6 max-w-2xl">
          Questa è una versione di prova: la richiesta è registrata solo nell&apos;archivio dimostrativo e non viene
          inoltrata a un finanziatore.
        </Notice>
      ) : null}
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Button asChild>
          <Link href="/">Torna alla home</Link>
        </Button>
        <Button asChild variant="secondary">
          <Link href="/guide">Leggi le guide</Link>
        </Button>
      </div>
    </div>
  );
}

/** Campo trappola per i bot: nascosto alle persone e alle tecnologie assistive. */
export function Honeypot({ register }: { register: React.InputHTMLAttributes<HTMLInputElement> }) {
  return (
    <div aria-hidden className="absolute -left-[9999px] h-px w-px overflow-hidden">
      <label>
        Lascia vuoto questo campo
        <input type="text" tabIndex={-1} autoComplete="off" {...register} />
      </label>
    </div>
  );
}
