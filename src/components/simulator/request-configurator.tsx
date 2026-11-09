"use client";

import Link from "next/link";
import { useId, useState } from "react";
import { ArrowRight, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AMOUNT_RANGE,
  DEFAULT_DURATION,
  DURATION_OPTIONS,
  SOLUTIONS,
  type Solution,
} from "@/lib/domain";
import { cn, formatEuro, formatMonths } from "@/lib/utils";

/**
 * Configuratore della richiesta.
 * In assenza di parametri economici approvati NON calcola rate, TAN o TAEG:
 * riepiloga importo, durata e tipologia e porta al modulo di preventivo.
 * Quando saranno disponibili condizioni verificate, il calcolo andrà aggiunto
 * qui dichiarando ipotesi e limiti (vedi README).
 */
const OPTIONS: { value: Solution; label: string }[] = [
  { value: "cessione-quinto", label: "Cessione del quinto" },
  { value: "prestito-delega", label: "Prestito per delega" },
  { value: "prestito-personale", label: "Prestito personale" },
  { value: "consiglio", label: "Non so ancora" },
];

const clampAmount = (n: number) =>
  Math.min(AMOUNT_RANGE.max, Math.max(AMOUNT_RANGE.min, Math.round(n / AMOUNT_RANGE.step) * AMOUNT_RANGE.step));

export function RequestConfigurator({
  defaultSolution = "cessione-quinto",
  className,
  headingLevel = "h2",
}: {
  defaultSolution?: Solution;
  className?: string;
  headingLevel?: "h2" | "h3";
}) {
  const uid = useId();
  const [solution, setSolution] = useState<Solution>(defaultSolution);
  const [amount, setAmount] = useState<number>(AMOUNT_RANGE.default);
  const [amountText, setAmountText] = useState<string>(String(AMOUNT_RANGE.default));
  const [duration, setDuration] = useState<number>(DEFAULT_DURATION);

  const durationIndex = DURATION_OPTIONS.indexOf(duration as (typeof DURATION_OPTIONS)[number]);
  const amountFill = ((amount - AMOUNT_RANGE.min) / (AMOUNT_RANGE.max - AMOUNT_RANGE.min)) * 100;
  const durationFill = (durationIndex / (DURATION_OPTIONS.length - 1)) * 100;
  const Heading = headingLevel;

  const href = `/richiesta-preventivo?soluzione=${solution}&importo=${amount}&durata=${duration}`;

  return (
    <div className={cn("grid grid-cols-1 overflow-hidden rounded-lg border border-line bg-white shadow-soft lg:grid-cols-[1.35fr_1fr]", className)}>
      <div className="min-w-0 space-y-8 p-5 sm:p-8">
        <fieldset>
          <legend className="text-[0.9375rem] font-medium text-navy-900">Tipologia di richiesta</legend>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {OPTIONS.map((o) => (
              <label
                key={o.value}
                className="relative flex min-h-12 cursor-pointer items-center justify-center rounded-md border border-line-strong px-3 py-2 text-center text-sm leading-snug text-navy-900 transition-colors hover:border-navy-700 has-[:checked]:border-navy-900 has-[:checked]:bg-navy-900 has-[:checked]:text-ivory has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-teal-700"
              >
                <input
                  type="radio"
                  name={`${uid}-solution`}
                  value={o.value}
                  checked={solution === o.value}
                  onChange={() => setSolution(o.value)}
                  className="sr-only"
                />
                {o.label}
              </label>
            ))}
          </div>
        </fieldset>

        <div>
          <div className="flex items-end justify-between gap-4">
            <label htmlFor={`${uid}-amount`} className="text-[0.9375rem] font-medium text-navy-900">
              Importo desiderato
            </label>
            <div className="flex items-center gap-2">
              <label htmlFor={`${uid}-amount-num`} className="sr-only">
                Importo in euro
              </label>
              <input
                id={`${uid}-amount-num`}
                inputMode="numeric"
                value={amountText}
                onChange={(e) => {
                  const digits = e.target.value.replace(/\D/g, "").slice(0, 6);
                  setAmountText(digits);
                  const n = Number(digits);
                  if (n >= AMOUNT_RANGE.min && n <= AMOUNT_RANGE.max) setAmount(n);
                }}
                onBlur={() => {
                  const n = clampAmount(Number(amountText) || AMOUNT_RANGE.min);
                  setAmount(n);
                  setAmountText(String(n));
                }}
                className="h-11 w-28 rounded-md border border-line-strong bg-paper px-3 text-right font-semibold text-navy-900 tabular-nums"
              />
              <span className="text-slate" aria-hidden>
                €
              </span>
            </div>
          </div>
          <input
            id={`${uid}-amount`}
            type="range"
            min={AMOUNT_RANGE.min}
            max={AMOUNT_RANGE.max}
            step={AMOUNT_RANGE.step}
            value={amount}
            aria-valuetext={formatEuro(amount)}
            onChange={(e) => {
              const n = Number(e.target.value);
              setAmount(n);
              setAmountText(String(n));
            }}
            className="range-aurfin mt-2"
            style={{ "--fill": `${amountFill}%` } as React.CSSProperties}
          />
          <div className="flex justify-between text-xs text-slate tabular-nums" aria-hidden>
            <span>{formatEuro(AMOUNT_RANGE.min)}</span>
            <span>{formatEuro(AMOUNT_RANGE.max)}</span>
          </div>
        </div>

        <div>
          <div className="flex items-end justify-between gap-4">
            <label htmlFor={`${uid}-duration`} className="text-[0.9375rem] font-medium text-navy-900">
              Durata desiderata
            </label>
            <output htmlFor={`${uid}-duration`} className="font-semibold text-navy-900 tabular-nums">
              {duration} mesi
            </output>
          </div>
          <input
            id={`${uid}-duration`}
            type="range"
            min={0}
            max={DURATION_OPTIONS.length - 1}
            step={1}
            value={durationIndex}
            aria-valuetext={formatMonths(duration)}
            onChange={(e) => setDuration(DURATION_OPTIONS[Number(e.target.value)])}
            className="range-aurfin mt-2"
            style={{ "--fill": `${durationFill}%` } as React.CSSProperties}
          />
          <div className="flex justify-between text-xs text-slate" aria-hidden>
            <span>{DURATION_OPTIONS[0]} mesi</span>
            <span>{DURATION_OPTIONS[DURATION_OPTIONS.length - 1]} mesi</span>
          </div>
        </div>
      </div>

      <div className="flex min-w-0 flex-col justify-between gap-8 border-t border-line bg-ivory p-5 sm:p-8 lg:border-t-0 lg:border-l">
        <div aria-live="polite">
          <Heading className="text-xs font-semibold tracking-[0.14em] text-brass-700 uppercase">Riepilogo della richiesta</Heading>
          <dl className="mt-5 space-y-4">
            <div>
              <dt className="text-sm text-slate">Tipologia</dt>
              <dd className="mt-0.5 font-serif text-xl text-navy-900">{SOLUTIONS[solution]}</dd>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <dt className="text-sm text-slate">Importo</dt>
                <dd className="mt-0.5 font-serif text-2xl text-navy-900 tabular-nums">{formatEuro(amount)}</dd>
              </div>
              <div>
                <dt className="text-sm text-slate">Durata</dt>
                <dd className="mt-0.5 font-serif text-2xl text-navy-900 tabular-nums">{duration} mesi</dd>
              </div>
            </div>
          </dl>
          <p className="mt-6 flex gap-2.5 text-sm leading-relaxed text-slate">
            <Info aria-hidden className="mt-0.5 size-4 shrink-0 text-navy-700" />
            <span>
              Questo strumento non calcola rate, tassi o costi e non è un&apos;offerta né un esito di valutazione.
              Le condizioni economiche vengono indicate solo nella documentazione del finanziatore, dopo l&apos;analisi
              della tua situazione.
            </span>
          </p>
        </div>
        <Button asChild size="lg" className="w-full">
          <Link href={href}>
            Approfondisci con un consulente
            <ArrowRight aria-hidden />
          </Link>
        </Button>
      </div>
    </div>
  );
}
