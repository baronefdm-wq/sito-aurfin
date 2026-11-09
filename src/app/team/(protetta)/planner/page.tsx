import Link from "next/link";
import { ChevronLeft, ChevronRight, Phone } from "lucide-react";
import { Card, PageTitle } from "@/components/app/app-shell";
import { ConfirmButton } from "@/components/app/confirm-button";
import { AppointmentBadge } from "@/components/app/status";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/form-controls";
import { Notice } from "@/components/ui/primitives";
import { addClosure, moveAppointment, removeClosure, setAppointmentStatus } from "@/app/team/actions";
import { internationalPhone } from "@/lib/case-summary";
import { CALL_MINUTES, SLOT_TIMES, addDays, formatAppointment, formatDayShort, isValidDate, romeDate, romeToIso, romeTime } from "@/lib/scheduling";
import { STAFF_ROLES, requireRole } from "@/lib/server/auth";
import { getWeekPlanner, listClosures } from "@/lib/server/repository";
import { cn } from "@/lib/utils";

export const metadata = { title: "Planner" };

const pick = (v: string | string[] | undefined) => (typeof v === "string" ? v : "");
const isPast = (day: string, time: string) => new Date(romeToIso(day, time)).getTime() < Date.now();

export default async function PlannerPage({ searchParams }: PageProps<"/team/planner">) {
  const viewer = await requireRole(STAFF_ROLES, "/team/accesso");
  const sp = await searchParams;
  const today = romeDate(new Date());
  const anyDate = isValidDate(pick(sp.settimana)) ? pick(sp.settimana) : today;
  const week = getWeekPlanner(viewer, anyDate);
  const selected = week.appointments.find((a) => a.id === pick(sp.appuntamento)) ?? null;
  const error = pick(sp.errore);
  const closures = listClosures(viewer);
  const isAdmin = viewer.role === "amministratore";
  const dateLabel = (d: string) => d.split("-").reverse().join("/");
  const weekUrl = `/team/planner?settimana=${week.monday}`;

  const inWeek = new Map(week.appointments.map((a) => [`${a.date} ${a.time}`, a]));
  // Appuntamenti precedenti al planner, fuori dalla griglia: restano visibili sotto la tabella.
  const offGrid = week.appointments.filter((a) => !SLOT_TIMES.includes(a.time));

  const rows = (times: string[]) =>
    times.map((time) => (
      <tr key={time} className="border-t border-line">
        <th scope="row" className="sticky left-0 z-10 bg-white px-2 py-0 text-right text-xs font-normal text-slate tabular-nums">
          {time}
        </th>
        {week.days.map((day) => {
          const appt = inWeek.get(`${day} ${time}`);
          const past = isPast(day, time);
          const closed = week.closed[`${day} ${time}`];
          return (
            <td
              key={day}
              title={closed ?? undefined}
              className={cn(
                "h-8 border-l border-line p-0.5",
                past && !appt && !closed && "bg-ivory",
                closed && "bg-[repeating-linear-gradient(135deg,var(--color-brass-100),var(--color-brass-100)_5px,var(--color-paper)_5px,var(--color-paper)_10px)]",
              )}
            >
              {appt ? (
                appt.request ? (
                  <Link
                    href={`${weekUrl}&appuntamento=${appt.id}`}
                    title={`${appt.request.name}, ${time}`}
                    aria-current={selected?.id === appt.id ? "true" : undefined}
                    className={cn(
                      "flex h-full min-h-7 items-center truncate rounded bg-teal-700 px-2 text-xs font-medium text-white hover:bg-teal-800",
                      selected?.id === appt.id && "outline-2 outline-offset-1 outline-navy-900",
                      appt.status === "svolto" && "bg-navy-200 text-navy-900 hover:bg-navy-200",
                    )}
                  >
                    <span className="truncate">{appt.request.name}</span>
                  </Link>
                ) : (
                  <span className="flex h-full min-h-7 items-center rounded bg-navy-100 px-2 text-xs text-navy-900">Occupato</span>
                )
              ) : (
                <span className="sr-only">{closed ? `Chiuso: ${closed}` : past ? "Passato" : "Libero"}</span>
              )}
            </td>
          );
        })}
      </tr>
    ));

  return (
    <>
      <PageTitle
        title="Planner"
        description={`Telefonate da ${CALL_MINUTES} minuti, una ogni 10. Un orario occupato sparisce subito dal sito; annullando torna libero.`}
        actions={
          <nav aria-label="Settimana" className="flex items-center gap-1">
            <Button asChild variant="secondary" size="icon">
              <Link href={`/team/planner?settimana=${addDays(week.monday, -7)}`} aria-label="Settimana precedente">
                <ChevronLeft aria-hidden />
              </Link>
            </Button>
            <Button asChild variant="secondary" size="sm" className="h-11">
              <Link href="/team/planner">Oggi</Link>
            </Button>
            <Button asChild variant="secondary" size="icon">
              <Link href={`/team/planner?settimana=${addDays(week.monday, 7)}`} aria-label="Settimana successiva">
                <ChevronRight aria-hidden />
              </Link>
            </Button>
          </nav>
        }
      />

      {error ? (
        <Notice tone="danger" role="alert" className="mb-6">
          {error}
        </Notice>
      ) : null}

      {week.conflicts.length ? (
        <Notice tone="warning" title="Telefonate in orari chiusi" className="mb-6">
          Queste telefonate erano già fissate e ora cadono in una chiusura: spostale o annullale.
          <ul className="mt-2 space-y-1">
            {week.conflicts.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/team/planner?settimana=${romeDate(c.startsAt)}&appuntamento=${c.id}`}
                  className="font-medium underline underline-offset-2"
                >
                  {c.name ?? "Telefonata di un collega"}
                </Link>{" "}
                · {formatAppointment(c.startsAt)}
              </li>
            ))}
          </ul>
        </Notice>
      ) : null}

      <div className="grid items-start gap-6 2xl:grid-cols-[1fr_22rem]">
        <div className="overflow-x-auto rounded-lg border border-line bg-white">
          <table className="w-full min-w-[42rem] table-fixed border-collapse">
            <caption className="sr-only">
              Telefonate della settimana del {formatDayShort(week.monday)}. Ogni riga è un orario, ogni colonna un giorno.
            </caption>
            <thead>
              <tr>
                <th scope="col" className="sticky left-0 z-10 w-14 bg-white">
                  <span className="sr-only">Orario</span>
                </th>
                {week.days.map((day) => (
                  <th
                    key={day}
                    scope="col"
                    aria-current={day === today ? "date" : undefined}
                    className={cn("border-l border-line px-2 py-2.5 text-sm font-medium capitalize", day === today ? "bg-navy-900 text-ivory" : "text-navy-900")}
                  >
                    {formatDayShort(day)}
                    {week.holidays[day] ? <span className="block text-xs font-normal normal-case">{week.holidays[day]}</span> : null}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows(week.morning)}
              <tr className="border-t border-line-strong bg-ivory">
                <td colSpan={6} className="px-2 py-1 text-center text-xs text-slate">
                  Pausa 13:00-14:30
                </td>
              </tr>
              {rows(week.afternoon)}
            </tbody>
          </table>
        </div>

        <div className="space-y-6">
          {selected?.request ? (
            <Card title="Telefonata">
              <p className="font-serif text-xl text-navy-900">{selected.request.name}</p>
              <p className="mt-1 text-navy-900 first-letter:uppercase">{formatAppointment(selected.startsAt)}</p>
              <p className="text-sm text-slate tabular-nums">{selected.request.reference}</p>
              <div className="mt-2">
                <AppointmentBadge status={selected.status} />
              </div>
              {selected.note ? <p className="mt-3 text-sm text-slate">{selected.note}</p> : null}
              <div className="mt-4 flex flex-wrap gap-2">
                {selected.request.phone ? (
                  <Button asChild size="sm">
                    <a href={`tel:+${internationalPhone(selected.request.phone)}`}>
                      <Phone aria-hidden /> Chiama
                    </a>
                  </Button>
                ) : null}
                <Button asChild size="sm" variant="secondary">
                  <Link href={`/team/pratiche/${selected.request.id}`}>Apri la pratica</Link>
                </Button>
              </div>

              {selected.canManage ? (
                <>
                  <form action={moveAppointment} className="mt-5 space-y-3 border-t border-line pt-5">
                    <input type="hidden" name="apptId" value={selected.id} />
                    <p className="font-medium text-navy-900">Sposta</p>
                    <div className="grid grid-cols-[1fr_6rem] gap-2">
                      <div>
                        <Label htmlFor="move-date">Giorno</Label>
                        <Input id="move-date" name="date" type="date" required defaultValue={selected.date} className="mt-1.5" />
                      </div>
                      <div>
                        <Label htmlFor="move-time">Ora</Label>
                        <Select id="move-time" name="time" defaultValue={romeTime(selected.startsAt)} className="mt-1.5 px-2.5 pr-7 tabular-nums">
                          {SLOT_TIMES.map((t) => (
                            <option key={t} value={t}>
                              {t}
                            </option>
                          ))}
                        </Select>
                      </div>
                    </div>
                    <Button type="submit" size="sm" variant="secondary">
                      Sposta la telefonata
                    </Button>
                  </form>
                  <form action={setAppointmentStatus} className="mt-4 flex flex-wrap items-center gap-3 border-t border-line pt-4">
                    <input type="hidden" name="id" value={selected.request.id} />
                    <input type="hidden" name="apptId" value={selected.id} />
                    <input type="hidden" name="status" value="annullato" />
                    <input type="hidden" name="back" value={weekUrl} />
                    <ConfirmButton message={`Annullare la telefonata con ${selected.request.name}? L'orario tornerà libero sul sito.`}>
                      Annulla la telefonata
                    </ConfirmButton>
                  </form>
                </>
              ) : (
                <p className="mt-4 border-t border-line pt-4 text-sm text-slate">
                  Per spostarla o annullarla, la pratica deve essere assegnata a te.
                </p>
              )}
            </Card>
          ) : (
            <Card title="Come si usa">
              <p className="text-sm leading-relaxed text-slate">
                Clicca su una telefonata per chiamare il cliente, spostarla o annullarla. Le nuove telefonate arrivano dal sito oppure si
                fissano dalla scheda di una pratica.
              </p>
            </Card>
          )}

          <Card title="Chiusure">
            {closures.length ? (
              <ul className="divide-y divide-line">
                {closures.map((c) => (
                  <li key={c.id} className="flex items-start justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
                    <div className="min-w-0 text-sm">
                      <p className="font-medium text-navy-900">{c.reason}</p>
                      <p className="text-slate">
                        {c.dateFrom === c.dateTo ? dateLabel(c.dateFrom) : `${dateLabel(c.dateFrom)} - ${dateLabel(c.dateTo)}`}
                        {c.timeFrom && c.timeTo ? ` · ${c.timeFrom}-${c.timeTo}` : " · tutto il giorno"}
                      </p>
                    </div>
                    {isAdmin ? (
                      <form action={removeClosure}>
                        <input type="hidden" name="closureId" value={c.id} />
                        <ConfirmButton message={`Rimuovere la chiusura «${c.reason}»? Gli orari torneranno prenotabili dal link nelle email.`}>Rimuovi</ConfirmButton>
                      </form>
                    ) : null}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate">Nessuna chiusura in programma. I festivi nazionali e il patrono di Roma sono già esclusi in automatico.</p>
            )}
            {isAdmin ? (
              <form action={addClosure} className="mt-4 space-y-3 border-t border-line pt-4">
                <p className="font-medium text-navy-900">Aggiungi una chiusura</p>
                <div>
                  <Label htmlFor="closure-reason">Motivo</Label>
                  <Input id="closure-reason" name="reason" required minLength={2} maxLength={80} placeholder="Es. Ferie estive" className="mt-1.5" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="closure-from">Dal giorno</Label>
                    <Input id="closure-from" name="dateFrom" type="date" required className="mt-1.5 px-2.5" />
                  </div>
                  <div>
                    <Label htmlFor="closure-to">Al giorno</Label>
                    <Input id="closure-to" name="dateTo" type="date" required className="mt-1.5 px-2.5" />
                  </div>
                </div>
                <fieldset>
                  <legend className="text-[0.9375rem] font-medium text-navy-900">Solo in questa fascia (facoltativo)</legend>
                  <p className="text-sm text-slate">Lascia vuoto per chiudere l&apos;intera giornata.</p>
                  <div className="mt-1.5 grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="closure-time-from">Dalle</Label>
                      <Input id="closure-time-from" name="timeFrom" type="time" className="mt-1.5 px-2.5" />
                    </div>
                    <div>
                      <Label htmlFor="closure-time-to">Alle</Label>
                      <Input id="closure-time-to" name="timeTo" type="time" className="mt-1.5 px-2.5" />
                    </div>
                  </div>
                </fieldset>
                <Button type="submit" size="sm">
                  Chiudi il calendario
                </Button>
              </form>
            ) : (
              <p className="mt-3 border-t border-line pt-3 text-sm text-slate">Le chiusure sono gestite da un amministratore.</p>
            )}
          </Card>

          {offGrid.length ? (
            <Card title="Fuori dagli orari">
              <ul className="space-y-2 text-sm">
                {offGrid.map((a) => (
                  <li key={a.id}>
                    {a.request ? (
                      <Link href={`${weekUrl}&appuntamento=${a.id}`} className="text-teal-700 hover:underline">
                        {a.request.name}
                      </Link>
                    ) : (
                      "Occupato"
                    )}{" "}
                    · {formatAppointment(a.startsAt)}
                  </li>
                ))}
              </ul>
            </Card>
          ) : null}
        </div>
      </div>
    </>
  );
}
