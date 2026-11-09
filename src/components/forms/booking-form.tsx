"use client";

import { useCallback, useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ChevronLeft, ChevronRight, Loader2, Phone } from "lucide-react";
import { submitJson } from "@/components/forms/submit";
import { Honeypot, SubmissionSuccess } from "@/components/forms/submission-result";
import { Button } from "@/components/ui/button";
import { Field, FieldError, Input, Textarea } from "@/components/ui/form-controls";
import { Notice } from "@/components/ui/primitives";
import { CALL_MINUTES, formatAppointment, formatDay, formatDayShort, mondayOf, romeTime } from "@/lib/scheduling";
import { bookingSchema, type BookingData, type BookingInput } from "@/lib/schemas";
import { cn } from "@/lib/utils";

type Day = { date: string; slots: string[] };

/** Solo orari realmente liberi: si aggiornano ogni minuto e dopo un conflitto. */
function useAvailability(token: string) {
  const [days, setDays] = useState<Day[] | null>(null);
  const [failed, setFailed] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch(`/api/appuntamento/${token}`, { cache: "no-store" });
      if (!res.ok) throw new Error();
      setDays(((await res.json()) as { days: Day[] }).days);
      setFailed(false);
    } catch {
      setFailed(true);
    }
  }, [token]);

  useEffect(() => {
    const load = () => void refresh();
    const first = setTimeout(load, 0);
    const timer = setInterval(load, 60_000);
    return () => {
      clearTimeout(first);
      clearInterval(timer);
    };
  }, [refresh]);

  return { days, failed, refresh };
}

function SlotPicker({
  days,
  value,
  onChange,
  error,
}: {
  days: Day[];
  value: string | undefined;
  onChange: (slot: string) => void;
  error?: string;
}) {
  const weeks = [...new Set(days.map((d) => mondayOf(d.date)))];
  const firstOpen = days.find((d) => d.slots.length)?.date ?? days[0]?.date;
  const [week, setWeek] = useState(() => mondayOf(firstOpen ?? ""));
  const [chosenDay, setChosenDay] = useState<string | undefined>(firstOpen);
  const weekIndex = weeks.indexOf(week);
  const weekDays = days.filter((d) => mondayOf(d.date) === week);
  const selectedDay = days.find((d) => d.date === chosenDay) ?? weekDays.find((d) => d.slots.length);
  const morning = selectedDay?.slots.filter((s) => romeTime(s) < "13:00") ?? [];
  const afternoon = selectedDay?.slots.filter((s) => romeTime(s) >= "13:00") ?? [];

  const changeWeek = (delta: number) => {
    const next = weeks[weekIndex + delta];
    if (!next) return;
    setWeek(next);
    setChosenDay(days.find((d) => mondayOf(d.date) === next && d.slots.length)?.date);
  };

  const times = (slots: string[], label: string) =>
    slots.length ? (
      <div>
        <p className="text-sm font-medium text-slate">{label}</p>
        <div className="mt-2 grid grid-cols-4 gap-2 sm:grid-cols-6">
          {slots.map((slot) => (
            <label
              key={slot}
              className={cn(
                "flex min-h-11 cursor-pointer items-center justify-center rounded-md border text-[0.9375rem] tabular-nums transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-teal-700",
                value === slot ? "border-navy-900 bg-navy-900 text-ivory" : "border-line-strong bg-white text-navy-900 hover:border-navy-700",
              )}
            >
              <input type="radio" name="b-slot" value={slot} checked={value === slot} onChange={() => onChange(slot)} className="sr-only" />
              {romeTime(slot)}
            </label>
          ))}
        </div>
      </div>
    ) : null;

  return (
    <fieldset aria-describedby={error ? "b-slot-error" : undefined}>
      <legend className="text-[0.9375rem] font-medium text-navy-900">Giorno e orario della telefonata</legend>
      <p className="mt-1.5 text-sm text-slate">Vedi solo gli orari ancora liberi. La chiamata dura circa {CALL_MINUTES} minuti.</p>

      <div className="mt-3 flex items-center justify-between gap-2">
        <Button type="button" variant="quiet" size="icon" aria-label="Settimana precedente" disabled={weekIndex <= 0} onClick={() => changeWeek(-1)}>
          <ChevronLeft aria-hidden />
        </Button>
        <p className="text-sm font-medium text-navy-900" aria-live="polite">
          {weekDays[0] ? `Settimana del ${formatDayShort(weekDays[0].date)}` : ""}
        </p>
        <Button type="button" variant="quiet" size="icon" aria-label="Settimana successiva" disabled={weekIndex >= weeks.length - 1} onClick={() => changeWeek(1)}>
          <ChevronRight aria-hidden />
        </Button>
      </div>

      <div className="mt-2 grid grid-cols-5 gap-1.5" role="group" aria-label="Giorni disponibili">
        {weekDays.map((d) => {
          const full = d.slots.length === 0;
          const [name, number] = formatDayShort(d.date).split(" ");
          return (
            <button
              key={d.date}
              type="button"
              disabled={full}
              aria-pressed={selectedDay?.date === d.date}
              aria-label={`${formatDay(d.date)}${full ? ", nessun orario libero" : `, ${d.slots.length} orari liberi`}`}
              onClick={() => setChosenDay(d.date)}
              className={cn(
                "flex min-h-14 flex-col items-center justify-center rounded-md border px-1 text-sm transition-colors",
                selectedDay?.date === d.date && "border-navy-900 bg-navy-50 shadow-[inset_0_0_0_1px_var(--color-navy-900)]",
                selectedDay?.date !== d.date && !full && "border-line-strong bg-white hover:border-navy-700",
                full && "cursor-not-allowed border-line bg-ivory text-slate/60",
              )}
            >
              <span className="capitalize">{name}</span>
              <span className="font-semibold tabular-nums">{number}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-4 space-y-4">
        {selectedDay?.slots.length ? (
          <>
            {times(morning, "Mattina")}
            {times(afternoon, "Pomeriggio")}
          </>
        ) : (
          <p className="rounded-md border border-dashed border-line-strong px-4 py-6 text-center text-sm text-slate">
            Nessun orario libero in questa settimana: passa a quella successiva.
          </p>
        )}
      </div>
      <FieldError id="b-slot-error" message={error} />
    </fieldset>
  );
}

export function BookingForm({ token, defaultPhone }: { token: string; defaultPhone: string }) {
  const [startedAt] = useState(() => Date.now());
  const [honeypot, setHoneypot] = useState("");
  const [serverError, setServerError] = useState<string | null>(null);
  const [done, setDone] = useState<{ reference: string; demo: boolean; startsAt: string } | null>(null);
  const { days, failed, refresh } = useAvailability(token);
  const {
    control,
    register,
    handleSubmit,
    setError,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<BookingInput, unknown, BookingData>({
    resolver: zodResolver(bookingSchema),
    mode: "onTouched",
    defaultValues: { phone: defaultPhone, slot: "", notes: "" },
  });

  const onSubmit = async (data: BookingData) => {
    setServerError(null);
    const res = await submitJson(`/api/appuntamento/${token}`, { ...data, website: honeypot, startedAt });
    if (res.ok) return setDone({ reference: res.reference, demo: res.demo, startsAt: String(res.extra.startsAt) });
    setServerError(res.message);
    Object.entries(res.fields ?? {}).forEach(([k, m]) => setError(k as keyof BookingInput, { message: m }));
    // Orario preso da un'altra persona: si aggiorna subito l'elenco.
    if (res.fields?.slot) {
      setValue("slot", "");
      await refresh();
    }
  };

  if (done) {
    return (
      <SubmissionSuccess title="La tua telefonata è prenotata" reference={done.reference} demo={done.demo}>
        <p className="flex items-start gap-2.5 text-lg text-navy-900">
          <Phone aria-hidden className="mt-1 size-5 shrink-0 text-teal-700" />
          <span className="first-letter:uppercase">{formatAppointment(done.startsAt)}</span>
        </p>
        <p>Ti chiamiamo noi al numero che hai indicato. La durata prevista è di {CALL_MINUTES} minuti.</p>
      </SubmissionSuccess>
    );
  }

  return (
    <form noValidate onSubmit={handleSubmit(onSubmit)} className="relative space-y-8">
      <Honeypot register={{ value: honeypot, onChange: (e) => setHoneypot(e.target.value), name: "website" }} />

      {failed && !days ? (
        <Notice tone="danger" role="alert">
          Non riusciamo a caricare gli orari disponibili.{" "}
          <button type="button" className="font-medium underline" onClick={() => void refresh()}>
            Riprova
          </button>
        </Notice>
      ) : !days ? (
        <p className="flex items-center gap-2 text-slate" role="status">
          <Loader2 aria-hidden className="size-4 animate-spin" /> Caricamento degli orari disponibili…
        </p>
      ) : days.some((d) => d.slots.length) ? (
        <Controller
          control={control}
          name="slot"
          render={({ field }) => <SlotPicker days={days} value={field.value} onChange={field.onChange} error={errors.slot?.message} />}
        />
      ) : (
        <Notice tone="warning" role="status">
          Al momento non ci sono orari liberi nei prossimi 30 giorni. Rispondi all&apos;email con il preventivo e
          troviamo una soluzione.
        </Notice>
      )}

      <Field id="b-phone" label="Telefono su cui chiamarti" error={errors.phone?.message} className="sm:max-w-sm">
        {(a) => <Input {...a} type="tel" autoComplete="tel" {...register("phone")} />}
      </Field>

      <Field id="b-notes" label="Note per il consulente" optional hint="Non inserire dati sanitari, bancari o di documenti di identità." error={errors.notes?.message}>
        {(a) => <Textarea {...a} rows={4} maxLength={800} {...register("notes")} />}
      </Field>

      {serverError ? (
        <Notice tone="danger" role="alert">
          {serverError}
        </Notice>
      ) : null}

      <Button type="submit" size="lg" disabled={isSubmitting} className="w-full sm:w-auto">
        {isSubmitting ? (
          <>
            <Loader2 aria-hidden className="animate-spin" /> Prenotazione in corso…
          </>
        ) : (
          "Prenota la telefonata"
        )}
      </Button>
    </form>
  );
}
