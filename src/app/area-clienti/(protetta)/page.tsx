import Link from "next/link";
import { Mail, Phone } from "lucide-react";
import { Card, EmptyState, PageTitle } from "@/components/app/app-shell";
import { AppointmentBadge, StatusBadge } from "@/components/app/status";
import { CLIENT_TIMELINE, MEETING_MODES, SOLUTIONS, STATUSES } from "@/lib/domain";
import { requireRole } from "@/lib/server/auth";
import { getClientOverview } from "@/lib/server/repository";
import { cn, formatDate, formatDateTime, formatEuro } from "@/lib/utils";

export default async function ClientDashboard() {
  const viewer = await requireRole(["cliente"], "/area-clienti/accesso");
  const overview = getClientOverview(viewer);

  if (!overview) {
    return (
      <>
        <PageTitle title={`Buongiorno, ${viewer.name.split(" ")[0]}`} />
        <EmptyState title="Non ci sono richieste collegate al tuo profilo." text="Se hai inviato una richiesta da poco, il consulente la collegherà al tuo profilo dopo il primo contatto." />
      </>
    );
  }

  const closed = overview.status === "conclusa" || overview.status === "non-proseguita";
  const currentIndex = CLIENT_TIMELINE.indexOf(overview.status);
  const missingDocs = overview.documents.filter((d) => d.status === "da-caricare" || d.status === "da-integrare");
  const nextAppt = overview.appointments.find((a) => new Date(a.startsAt) > new Date() && a.status !== "svolto");

  return (
    <>
      <PageTitle
        title={`Buongiorno, ${viewer.name.split(" ")[0]}`}
        description={`Richiesta ${overview.reference} · inviata il ${formatDate(overview.createdAt)} · ultimo aggiornamento ${formatDate(overview.updatedAt)}`}
      />

      <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <div className="space-y-6">
          <Card title="Riepilogo della richiesta" action={<StatusBadge status={overview.status} audience="client" />}>
            <dl className="grid gap-5 sm:grid-cols-3">
              <div>
                <dt className="text-sm text-slate">Soluzione</dt>
                <dd className="mt-1 font-serif text-xl text-navy-900">{overview.solution ? SOLUTIONS[overview.solution] : "—"}</dd>
              </div>
              <div>
                <dt className="text-sm text-slate">Importo indicato</dt>
                <dd className="mt-1 font-serif text-xl text-navy-900 tabular-nums">{overview.amount ? formatEuro(overview.amount) : "—"}</dd>
              </div>
              <div>
                <dt className="text-sm text-slate">Durata indicata</dt>
                <dd className="mt-1 font-serif text-xl text-navy-900 tabular-nums">
                  {overview.durationMonths ? `${overview.durationMonths} mesi` : "—"}
                </dd>
              </div>
            </dl>
            <p className="mt-5 text-sm text-slate">
              Importo e durata sono quelli indicati nella richiesta: non costituiscono una proposta né un esito della
              valutazione.
            </p>
          </Card>

          <Card title="Stato di avanzamento">
            {closed ? (
              <p className="text-navy-900">{STATUSES[overview.status].client}.</p>
            ) : (
              <ol className="relative">
                {CLIENT_TIMELINE.map((s, i) => {
                  const state = i < currentIndex ? "done" : i === currentIndex ? "current" : "todo";
                  return (
                    <li key={s} className="relative flex gap-4 pb-6 last:pb-0" aria-current={state === "current" ? "step" : undefined}>
                      {i < CLIENT_TIMELINE.length - 1 ? (
                        <span
                          aria-hidden
                          className={cn("absolute top-7 bottom-0 left-[0.6875rem] w-px", i < currentIndex ? "bg-teal-700" : "bg-line-strong")}
                        />
                      ) : null}
                      <span
                        aria-hidden
                        className={cn(
                          "relative mt-0.5 flex size-[1.375rem] shrink-0 items-center justify-center rounded-full border-2 text-[0.625rem] font-bold",
                          state === "done" && "border-teal-700 bg-teal-700 text-white",
                          state === "current" && "border-navy-900 bg-white ring-4 ring-navy-100",
                          state === "todo" && "border-line-strong bg-white",
                        )}
                      >
                        {state === "done" ? "✓" : null}
                      </span>
                      <div>
                        <p className={cn("leading-snug", state === "todo" ? "text-slate" : "font-medium text-navy-900")}>
                          {STATUSES[s].client}
                        </p>
                        <p className="sr-only">
                          {state === "done" ? "completato" : state === "current" ? "fase attuale" : "da svolgere"}
                        </p>
                        {state === "current" ? (
                          <p className="mt-1 text-sm text-slate">
                            {s === "documenti"
                              ? `${missingDocs.length} documenti da fornire o integrare.`
                              : "Il consulente ti aggiornerà al prossimo passaggio."}
                          </p>
                        ) : null}
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
            <p className="mt-6 border-t border-line pt-4 text-sm text-slate">
              La valutazione e l&apos;eventuale concessione del finanziamento spettano al soggetto finanziatore.
            </p>
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Il tuo consulente">
            {overview.advisor ? (
              <div>
                <p className="font-serif text-xl text-navy-900">{overview.advisor.name}</p>
                <ul className="mt-3 space-y-2 text-[0.9375rem]">
                  <li>
                    <a href={`mailto:${overview.advisor.email}`} className="inline-flex min-h-10 items-center gap-2 text-teal-700 hover:underline">
                      <Mail aria-hidden className="size-4" /> {overview.advisor.email}
                    </a>
                  </li>
                  {overview.advisor.phone ? (
                    <li className="flex min-h-10 items-center gap-2 text-navy-900">
                      <Phone aria-hidden className="size-4" /> {overview.advisor.phone}
                    </li>
                  ) : null}
                </ul>
              </div>
            ) : (
              <EmptyState title="Consulente non ancora assegnato" text="Ti contatteremo a breve." />
            )}
          </Card>

          <Card title="Prossimo appuntamento" action={<Link href="/area-clienti/appuntamenti" className="text-sm font-medium text-teal-700 hover:underline">Tutti</Link>}>
            {nextAppt ? (
              <div>
                <p className="font-serif text-xl text-navy-900">{formatDateTime(nextAppt.startsAt)}</p>
                <p className="mt-1 text-slate">{MEETING_MODES[nextAppt.mode]}</p>
                <div className="mt-3">
                  <AppointmentBadge status={nextAppt.status} />
                </div>
              </div>
            ) : (
              <EmptyState title="Nessun appuntamento in programma" />
            )}
          </Card>

          <Card title="Documenti" action={<Link href="/area-clienti/documenti" className="text-sm font-medium text-teal-700 hover:underline">Vedi elenco</Link>}>
            <p className="text-navy-900">
              <span className="font-serif text-3xl tabular-nums">{missingDocs.length}</span>{" "}
              <span className="text-slate">da fornire o integrare su {overview.documents.length}</span>
            </p>
          </Card>
        </div>
      </div>
    </>
  );
}
