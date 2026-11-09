"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, ArrowRight, Loader2, Lock, Pencil } from "lucide-react";
import { ChoiceGroup } from "@/components/forms/choice-group";
import { DocumentPicker } from "@/components/forms/document-picker";
import { submitJson } from "@/components/forms/submit";
import { Honeypot, SubmissionSuccess } from "@/components/forms/submission-result";
import { Button } from "@/components/ui/button";
import { Checkbox, Field, Input, Select, Textarea } from "@/components/ui/form-controls";
import { Notice } from "@/components/ui/primitives";
import {
  AGE_BANDS,
  AMOUNT_RANGE,
  CONTRACT_TYPES,
  EMPLOYER_SIZES,
  EXISTING_LOANS,
  INCOME_BANDS,
  SENIORITY_BANDS,
  DEFAULT_DURATION,
  DURATION_OPTIONS,
  SOLUTIONS,
  SOLUTION_KEYS,
  WORK_CATEGORIES,
  type Solution,
} from "@/lib/domain";
import { getDocumentSlots } from "@/lib/document-requirements";
import { quoteSchema, quoteSteps, type QuoteData, type QuoteInput } from "@/lib/schemas";
import { site } from "@/config/site";
import { cn, formatEuro, formatMonths } from "@/lib/utils";

/**
 * Percorso di richiesta a passaggi.
 * I dati restano in memoria durante la navigazione tra i passaggi.
 * Solo le scelte non personali (soluzione, categoria, importo, durata) vengono
 * conservate in sessionStorage per la durata della scheda: nessun dato
 * personale viene salvato nel browser.
 */
const DRAFT_KEY = "aurfin:quote-draft";
type Draft = Pick<QuoteInput, "solution" | "workCategory" | "amount" | "durationMonths">;

const solutionChoices = [
  { value: "cessione-quinto" as const, label: SOLUTIONS["cessione-quinto"], description: "Rimborso con trattenuta su stipendio o pensione." },
  { value: "prestito-delega" as const, label: SOLUTIONS["prestito-delega"], description: "Per dipendenti, se il datore di lavoro accetta la delega." },
  { value: "prestito-personale" as const, label: SOLUTIONS["prestito-personale"], description: "Rimborso a rate, di norma con addebito sul conto." },
  { value: "consiglio" as const, label: SOLUTIONS.consiglio, description: "Ne parliamo insieme e ti aiutiamo a orientarti." },
];

const workChoices = (Object.keys(WORK_CATEGORIES) as (keyof typeof WORK_CATEGORIES)[]).map((k) => ({
  value: k,
  label: WORK_CATEGORIES[k],
}));

type UploadReport = { uploaded: string[]; failed: { name: string; error: string }[] };

async function uploadFile(token: string, documentId: string, file: File) {
  const body = new FormData();
  body.append("documentId", documentId);
  body.append("file", file);
  try {
    const res = await fetch("/api/richieste/documenti", { method: "POST", headers: { "X-Upload-Token": token }, body });
    if (res.ok) return null;
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    return data.error ?? "Caricamento non riuscito.";
  } catch {
    return "Connessione non riuscita.";
  }
}

function PrequalSelect({
  id,
  label,
  options,
  register,
}: {
  id: string;
  label: string;
  options: Record<string, string>;
  register: React.SelectHTMLAttributes<HTMLSelectElement>;
}) {
  return (
    <Field id={id} label={label} optional>
      {(a) => (
        <Select {...a} {...register}>
          <option value="">Preferisco non indicarlo</option>
          {Object.entries(options).map(([value, text]) => (
            <option key={value} value={value}>
              {text}
            </option>
          ))}
        </Select>
      )}
    </Field>
  );
}

export function QuoteWizard({ uploadsEnabled }: { uploadsEnabled: boolean }) {
  const params = useSearchParams();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [done, setDone] = useState<{ reference: string; demo: boolean; report: UploadReport } | null>(null);
  const [files, setFiles] = useState<Record<string, File[]>>({});
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const employee = (category?: string) => category === "dipendente-pubblico" || category === "dipendente-privato";
  const [startedAt] = useState(() => Date.now());
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [honeypot, setHoneypot] = useState("");
  const firstRender = useRef(true);

  const form = useForm<QuoteInput, unknown, QuoteData>({
    resolver: zodResolver(quoteSchema),
    mode: "onTouched",
    shouldUnregister: false,
    defaultValues: {
      amount: AMOUNT_RANGE.default,
      durationMonths: DEFAULT_DURATION,
      message: "",
      contractType: "",
      seniority: "",
      employerSize: "",
      incomeBand: "",
      existingLoans: "",
      ageBand: "",
      channel: "",
      agentInfoAck: false,
      privacyAck: false,
      marketingConsent: false,
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
    },
  });
  const { control, register, handleSubmit, trigger, watch, setValue, setError, formState } = form;
  const errors = formState.errors;
  const values = watch();
  const slots = getDocumentSlots(values.solution, values.workCategory);
  const fileCount = slots.reduce((n, s) => n + (files[s.id]?.length ?? 0), 0);

  // Ripristino delle scelte non personali e precompilazione dal configuratore.
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(DRAFT_KEY);
      if (raw) {
        const draft = JSON.parse(raw) as Partial<Draft>;
        (Object.keys(draft) as (keyof Draft)[]).forEach((k) => {
          if (draft[k] !== undefined) setValue(k, draft[k] as never);
        });
      }
    } catch {
      /* sessionStorage non disponibile: si procede senza bozza */
    }
    const s = params.get("soluzione");
    if (s && (SOLUTION_KEYS as string[]).includes(s)) setValue("solution", s as Solution);
    const a = Number(params.get("importo"));
    if (a >= AMOUNT_RANGE.min && a <= AMOUNT_RANGE.max) setValue("amount", a);
    const d = Number(params.get("durata"));
    if ((DURATION_OPTIONS as readonly number[]).includes(d)) setValue("durationMonths", d);
    // Codice di provenienza non personale (es. convenzione): serve solo a misurare i canali.
    const channel = params.get("canale")?.toLowerCase();
    if (channel && /^[a-z0-9-]{1,40}$/.test(channel)) setValue("channel", channel);
  }, [params, setValue]);

  useEffect(() => {
    try {
      const draft: Draft = {
        solution: values.solution,
        workCategory: values.workCategory,
        amount: values.amount,
        durationMonths: values.durationMonths,
      };
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    } catch {
      /* ignorato */
    }
  }, [values.solution, values.workCategory, values.amount, values.durationMonths]);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    headingRef.current?.focus();
  }, [step, done]);

  const next = async () => {
    // I documenti si allegano solo dopo la presa visione dell'informativa sull'intermediario.
    if (quoteSteps[step].id === "documenti" && fileCount > 0 && !values.agentInfoAck) {
      setError("agentInfoAck", { message: "Per allegare i documenti conferma di aver letto l'informativa sull'intermediario." });
      return;
    }
    const ok = await trigger(quoteSteps[step].fields as unknown as (keyof QuoteInput)[], { shouldFocus: true });
    if (ok) setStep((s) => Math.min(s + 1, quoteSteps.length - 1));
  };
  const back = () => setStep((s) => Math.max(0, s - 1));

  const onSubmit = async (data: QuoteData) => {
    setSubmitting(true);
    setServerError(null);
    const result = await submitJson("/api/richieste", { ...data, website: honeypot, startedAt });
    if (result.ok) {
      try {
        sessionStorage.removeItem(DRAFT_KEY);
      } catch {}
      // La richiesta è registrata: ora si caricano i documenti, uno alla volta.
      const report: UploadReport = { uploaded: [], failed: [] };
      const queue = slots.flatMap((s) => (files[s.id] ?? []).map((f) => ({ slot: s, file: f })));
      if (queue.length) {
        const token = result.extra?.uploadToken;
        if (typeof token !== "string") {
          queue.forEach(({ file }) => report.failed.push({ name: file.name, error: "Caricamento non disponibile." }));
        } else {
          setProgress({ done: 0, total: queue.length });
          for (const [i, { slot, file }] of queue.entries()) {
            const error = await uploadFile(token, slot.id, file);
            if (error) report.failed.push({ name: file.name, error });
            else report.uploaded.push(`${slot.label}: ${file.name}`);
            setProgress({ done: i + 1, total: queue.length });
          }
        }
      }
      setSubmitting(false);
      setProgress(null);
      setFiles({});
      setDone({ reference: result.reference, demo: result.demo, report });
      return;
    }
    setSubmitting(false);
    setServerError(result.message);
    if (result.fields) {
      let firstStep: number | null = null;
      for (const [field, message] of Object.entries(result.fields)) {
        setError(field as keyof QuoteInput, { message });
        const idx = quoteSteps.findIndex((s) => (s.fields as readonly string[]).includes(field));
        if (idx >= 0 && (firstStep === null || idx < firstStep)) firstStep = idx;
      }
      if (firstStep !== null && firstStep !== step) setStep(firstStep);
    }
  };

  if (done) {
    return (
      <div>
        <h2 ref={headingRef} tabIndex={-1} className="sr-only">
          Richiesta inviata
        </h2>
        <SubmissionSuccess title="Abbiamo ricevuto la tua richiesta" reference={done.reference} demo={done.demo}>
          <p>
            {site.firstResponsePromise} Conserva il codice di riferimento per eventuali comunicazioni.
          </p>
          {done.report.uploaded.length ? (
            <div>
              <p className="font-medium text-navy-900">Documenti ricevuti ({done.report.uploaded.length}):</p>
              <ul className="mt-1 list-disc pl-5">
                {done.report.uploaded.map((u) => (
                  <li key={u}>{u}</li>
                ))}
              </ul>
            </div>
          ) : (
            <p>Non hai allegato documenti: il consulente ti indicherà quali servono.</p>
          )}
          <p>
            Puoi caricare i documenti in seguito dall&apos;
            <Link href="/area-clienti/accesso" className="font-medium text-teal-700 underline underline-offset-2">
              area clienti
            </Link>
            : ti basta l&apos;email che hai indicato, riceverai un link di accesso.
          </p>
          {done.report.failed.length ? (
            <Notice tone="warning" title="Alcuni file non sono stati caricati">
              <ul className="list-disc pl-5">
                {done.report.failed.map((f) => (
                  <li key={f.name}>
                    {f.name}: {f.error}
                  </li>
                ))}
              </ul>
              <p className="mt-2">La richiesta è comunque registrata: potrai inviarli in seguito.</p>
            </Notice>
          ) : null}
        </SubmissionSuccess>
      </div>
    );
  }

  const current = quoteSteps[step];
  const amountFill = (((values.amount ?? AMOUNT_RANGE.default) - AMOUNT_RANGE.min) / (AMOUNT_RANGE.max - AMOUNT_RANGE.min)) * 100;

  return (
    <div className="grid gap-10 lg:grid-cols-[15rem_1fr] lg:gap-14">
      {/* Indicatore di avanzamento */}
      <nav aria-label="Avanzamento della richiesta">
        <p className="text-sm text-slate lg:hidden">
          Passaggio {step + 1} di {quoteSteps.length}: <span className="font-medium text-navy-900">{current.title}</span>
        </p>
        <div className="mt-3 h-1 overflow-hidden rounded-full bg-line lg:hidden" aria-hidden>
          <div
            className="h-full rounded-full bg-navy-900 transition-[width] duration-500 ease-[var(--ease-out-soft)]"
            style={{ width: `${((step + 1) / quoteSteps.length) * 100}%` }}
          />
        </div>
        <ol className="hidden space-y-1 lg:block">
          {quoteSteps.map((s, i) => (
            <li key={s.id}>
              <span
                aria-current={i === step ? "step" : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2.5 text-[0.9375rem]",
                  i === step && "bg-white font-medium text-navy-900 shadow-soft",
                  i < step && "text-navy-900",
                  i > step && "text-slate",
                )}
              >
                <span
                  className={cn(
                    "flex size-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold tabular-nums",
                    i < step && "border-teal-700 bg-teal-700 text-white",
                    i === step && "border-navy-900 bg-navy-900 text-ivory",
                    i > step && "border-line-strong",
                  )}
                >
                  {i < step ? <span aria-hidden>✓</span> : i + 1}
                </span>
                {s.title}
                {i < step ? <span className="sr-only">(completato)</span> : null}
              </span>
            </li>
          ))}
        </ol>
      </nav>

      <form noValidate onSubmit={handleSubmit(onSubmit)} className="relative min-w-0">
        <Honeypot register={{ value: honeypot, onChange: (e) => setHoneypot(e.target.value), name: "website" }} />
        <div className="rounded-lg border border-line bg-white p-5 shadow-soft sm:p-8">
          <h2 ref={headingRef} tabIndex={-1} className="font-serif text-2xl text-navy-900 focus:outline-none sm:text-3xl">
            {step === 0 && "Quale soluzione vorresti approfondire?"}
            {step === 1 && "Qual è la tua situazione lavorativa?"}
            {step === 2 && "Di quale importo hai bisogno, e in quanto tempo vorresti rimborsarlo?"}
            {step === 3 && "A chi inviamo il preventivo?"}
            {step === 4 && "Vuoi allegare subito i documenti?"}
            {step === 5 && "Controlla e invia la richiesta"}
          </h2>

          <div className="mt-7 space-y-7">
            {step === 0 && (
              <Controller
                control={control}
                name="solution"
                render={({ field }) => (
                  <ChoiceGroup
                    name="solution"
                    legend="Soluzione di interesse"
                    hint="Se non sei sicuro, scegli «Vorrei un consiglio»."
                    choices={solutionChoices}
                    value={field.value}
                    onChange={(v) => field.onChange(v)}
                    error={errors.solution?.message}
                  />
                )}
              />
            )}

            {step === 1 && (
              <Controller
                control={control}
                name="workCategory"
                render={({ field }) => (
                  <ChoiceGroup
                    name="workCategory"
                    legend="Situazione lavorativa"
                    hint="Serve a orientare il primo colloquio. Non ti chiediamo il nome del datore di lavoro."
                    choices={workChoices}
                    value={field.value}
                    onChange={(v) => field.onChange(v)}
                    error={errors.workCategory?.message}
                  />
                )}
              />
            )}
            {step === 1 && values.workCategory ? (
              <div className="rounded-md bg-ivory p-4 sm:p-5">
                <p className="font-medium text-navy-900">Qualche dettaglio in più (facoltativo)</p>
                <p className="mt-1 text-sm text-slate">
                  Aiuta il consulente a prepararsi. Sono solo indicazioni: non determinano alcun esito. Puoi lasciare vuoto ciò che preferisci.
                </p>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  {employee(values.workCategory) ? (
                    <>
                      <PrequalSelect id="contractType" label="Tipo di contratto" options={CONTRACT_TYPES} register={register("contractType")} />
                      <PrequalSelect id="seniority" label="Anzianità di servizio" options={SENIORITY_BANDS} register={register("seniority")} />
                    </>
                  ) : null}
                  {values.workCategory === "dipendente-privato" ? (
                    <PrequalSelect id="employerSize" label="Dimensione dell'azienda" options={EMPLOYER_SIZES} register={register("employerSize")} />
                  ) : null}
                  {values.workCategory === "pensionato" ? (
                    <PrequalSelect id="ageBand" label="Fascia di età" options={AGE_BANDS} register={register("ageBand")} />
                  ) : null}
                  <PrequalSelect id="incomeBand" label="Stipendio o pensione netti al mese" options={INCOME_BANDS} register={register("incomeBand")} />
                  <PrequalSelect id="existingLoans" label="Finanziamenti già in corso" options={EXISTING_LOANS} register={register("existingLoans")} />
                </div>
              </div>
            ) : null}

            {step === 2 && (
              <>
                <Controller
                  control={control}
                  name="amount"
                  render={({ field }) => (
                    <div className="space-y-2">
                      <label htmlFor="amount" className="block text-[0.9375rem] font-medium text-navy-900">
                        Importo desiderato
                      </label>
                      <p id="amount-hint" className="text-sm text-slate">
                        Da {formatEuro(AMOUNT_RANGE.min)} a {formatEuro(AMOUNT_RANGE.max)}. È un&apos;indicazione: potrai rivederla con il consulente.
                      </p>
                      <div className="flex items-center gap-3">
                        <Input
                          id="amount"
                          inputMode="numeric"
                          className="max-w-44 text-right font-semibold tabular-nums"
                          aria-describedby={errors.amount ? "amount-hint amount-error" : "amount-hint"}
                          aria-invalid={Boolean(errors.amount)}
                          value={Number.isFinite(field.value) ? String(field.value) : ""}
                          onChange={(e) => {
                            const digits = e.target.value.replace(/\D/g, "").slice(0, 6);
                            field.onChange(digits === "" ? Number.NaN : Number(digits));
                          }}
                          onBlur={field.onBlur}
                        />
                        <span className="text-slate">euro</span>
                      </div>
                      <input
                        type="range"
                        aria-label="Regola l'importo"
                        min={AMOUNT_RANGE.min}
                        max={AMOUNT_RANGE.max}
                        step={AMOUNT_RANGE.step}
                        value={Number.isFinite(field.value) ? field.value : AMOUNT_RANGE.default}
                        aria-valuetext={formatEuro(Number(field.value) || AMOUNT_RANGE.default)}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                        className="range-aurfin"
                        style={{ "--fill": `${Math.min(100, Math.max(0, amountFill))}%` } as React.CSSProperties}
                      />
                      {errors.amount ? (
                        <p id="amount-error" className="text-sm font-medium text-danger">
                          {errors.amount.message}
                        </p>
                      ) : null}
                    </div>
                  )}
                />
                <Controller
                  control={control}
                  name="durationMonths"
                  render={({ field }) => (
                    <ChoiceGroup
                      name="durationMonths"
                      legend="Durata desiderata (mesi)"
                      choices={DURATION_OPTIONS.map((d) => ({ value: d as number, label: `${d}` }))}
                      value={field.value}
                      onChange={(v) => field.onChange(v)}
                      columns={5}
                      size="sm"
                      error={errors.durationMonths?.message}
                    />
                  )}
                />
                <Notice tone="info">
                  Non calcoliamo una rata: rata, tassi e costi dipendono dalla valutazione del finanziatore e ti vengono
                  comunicati solo con un&apos;eventuale proposta.
                </Notice>
              </>
            )}

            {step === 3 && (
              <>
                <div className="grid gap-6 sm:grid-cols-2">
                  <Field id="firstName" label="Nome" error={errors.firstName?.message}>
                    {(a) => <Input {...a} autoComplete="given-name" {...register("firstName")} />}
                  </Field>
                  <Field id="lastName" label="Cognome" error={errors.lastName?.message}>
                    {(a) => <Input {...a} autoComplete="family-name" {...register("lastName")} />}
                  </Field>
                  <Field id="email" label="Email" error={errors.email?.message}>
                    {(a) => <Input {...a} type="email" autoComplete="email" inputMode="email" {...register("email")} />}
                  </Field>
                  <Field id="phone" label="Telefono" error={errors.phone?.message}>
                    {(a) => <Input {...a} type="tel" autoComplete="tel" inputMode="tel" {...register("phone")} />}
                  </Field>
                </div>
                <Field
                  id="message"
                  label="Vuoi aggiungere qualcosa?"
                  optional
                  hint="Non inserire dati sanitari, bancari o di documenti di identità."
                  error={errors.message?.message}
                >
                  {(a) => <Textarea {...a} rows={4} maxLength={800} {...register("message")} />}
                </Field>
              </>
            )}

            {step === 4 && (
              <>
                <p className="leading-relaxed text-slate">
                  È facoltativo, ma aiuta il consulente a valutare la tua situazione più rapidamente. L&apos;elenco è
                  indicativo e dipende dalle risposte che hai dato: puoi allegare solo alcuni documenti, o nessuno, e
                  inviare gli altri in seguito dall&apos;area riservata.
                </p>
                {uploadsEnabled ? (
                  <>
                    <div className="rounded-md border border-navy-200 bg-navy-50 p-4">
                      <p className="font-medium text-navy-900">Prima di allegare: chi tratta la tua richiesta</p>
                      <p className="mt-1 text-sm leading-relaxed text-navy-900">
                        {site.company.legalName ?? "AURFIN"} opera come agente in attività finanziaria: raccoglie i documenti per
                        presentare la richiesta al finanziatore, che decide in autonomia. Trovi ruolo, iscrizione e diritti
                        nell&apos;{" "}
                        <Link href="/informativa-intermediario" target="_blank" className="font-medium text-teal-700 underline underline-offset-2">
                          informativa sull&apos;intermediario<span className="sr-only"> (si apre in una nuova scheda)</span>
                        </Link>
                        .
                      </p>
                      <Checkbox
                        id="agentInfoAck"
                        className="mt-3"
                        {...register("agentInfoAck")}
                        error={errors.agentInfoAck?.message}
                        label="Ho letto l'informativa sull'intermediario. Necessario solo se alleghi documenti."
                      />
                    </div>
                    <div className="space-y-3">
                      {slots.map((slot) => (
                        <DocumentPicker
                          key={slot.id}
                          slot={slot}
                          files={files[slot.id] ?? []}
                          onChange={(list) => setFiles((prev) => ({ ...prev, [slot.id]: list }))}
                        />
                      ))}
                    </div>
                    <p className="flex gap-2.5 text-sm leading-relaxed text-slate">
                      <Lock aria-hidden className="mt-0.5 size-4 shrink-0 text-teal-700" />
                      <span>
                        Formati PDF, JPG o PNG, fino a 10 MB per file. I file vengono trasmessi solo quando invii la
                        richiesta, sono conservati in un archivio privato e possono essere consultati solo dal personale
                        autorizzato. Non inviare coordinate bancarie. Nelle buste paga puoi oscurare le voci che non servono
                        alla richiesta, come eventuali trattenute sindacali.
                      </span>
                    </p>
                  </>
                ) : (
                  <Notice tone="warning" title="Caricamento non disponibile">
                    Lo storage privato dei documenti non è configurato: potrai inviare i documenti al consulente dopo il
                    primo contatto.
                  </Notice>
                )}
              </>
            )}

            {step === 5 && (
              <>
                <dl className="divide-y divide-line rounded-md border border-line">
                  {[
                    { label: "Soluzione", value: values.solution ? SOLUTIONS[values.solution] : "—", to: 0 },
                    { label: "Situazione lavorativa", value: values.workCategory ? WORK_CATEGORIES[values.workCategory] : "—", to: 1 },
                    {
                      label: "Importo e durata",
                      value: `${formatEuro(Number(values.amount))} · ${formatMonths(Number(values.durationMonths))}`,
                      to: 2,
                    },
                    {
                      label: "Recapiti",
                      value: `${values.firstName} ${values.lastName} · ${values.email} · ${values.phone}`,
                      to: 3,
                    },
                    {
                      label: "Documenti",
                      value: fileCount
                        ? `${fileCount} ${fileCount === 1 ? "file allegato" : "file allegati"}: ${slots
                            .filter((s) => files[s.id]?.length)
                            .map((s) => s.label)
                            .join(", ")}`
                        : "Nessun documento allegato (potrai inviarli in seguito)",
                      to: 4,
                    },
                  ].map((row) => (
                    <div key={row.label} className="flex flex-wrap items-start justify-between gap-x-6 gap-y-1 px-4 py-3.5">
                      <div className="min-w-0">
                        <dt className="text-sm text-slate">{row.label}</dt>
                        <dd className="mt-0.5 break-words text-navy-900">{row.value}</dd>
                      </div>
                      <button
                        type="button"
                        onClick={() => setStep(row.to)}
                        className="inline-flex min-h-10 items-center gap-1.5 rounded-md px-2 text-sm font-medium text-teal-700 hover:bg-teal-50"
                      >
                        <Pencil aria-hidden className="size-3.5" />
                        Modifica<span className="sr-only"> {row.label.toLowerCase()}</span>
                      </button>
                    </div>
                  ))}
                </dl>

                <div className="space-y-5 rounded-md bg-ivory p-4 sm:p-5">
                  <Checkbox
                    id="privacyAck"
                    {...register("privacyAck")}
                    error={errors.privacyAck?.message}
                    label={
                      <>
                        Ho letto l&apos;
                        <Link href="/privacy" target="_blank" className="font-medium text-teal-700 underline underline-offset-2">
                          informativa sul trattamento dei dati personali
                          <span className="sr-only"> (si apre in una nuova scheda)</span>
                        </Link>{" "}
                        e chiedo di ricevere una risposta a questa richiesta.
                      </>
                    }
                  />
                  <Checkbox
                    id="marketingConsent"
                    {...register("marketingConsent")}
                    label="Acconsento a ricevere comunicazioni commerciali e informative da AURFIN."
                    description="Facoltativo. Il consenso non influisce sulla gestione della richiesta e puoi revocarlo in qualsiasi momento."
                  />
                </div>
              </>
            )}
          </div>

          {serverError ? (
            <Notice tone="danger" role="alert" className="mt-7">
              {serverError}
            </Notice>
          ) : null}

          <div className="mt-9 flex flex-col-reverse gap-3 border-t border-line pt-6 sm:flex-row sm:items-center sm:justify-between">
            {step > 0 ? (
              <Button type="button" variant="quiet" onClick={back}>
                <ArrowLeft aria-hidden />
                Indietro
              </Button>
            ) : (
              <span className="hidden sm:block" />
            )}
            {step < quoteSteps.length - 1 ? (
              <Button type="button" size="lg" onClick={next}>
                Continua
                <ArrowRight aria-hidden />
              </Button>
            ) : (
              <Button type="submit" size="lg" disabled={submitting} aria-disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 aria-hidden className="animate-spin" />
                    <span aria-live="polite">
                      {progress ? `Caricamento documenti ${progress.done} di ${progress.total}…` : "Invio in corso…"}
                    </span>
                  </>
                ) : (
                  "Invia la richiesta"
                )}
              </Button>
            )}
          </div>
        </div>
        <p className="mt-4 text-sm text-slate">
          Inviare la richiesta non comporta alcun impegno e non costituisce domanda di finanziamento.
        </p>
      </form>
    </div>
  );
}
