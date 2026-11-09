import Link from "next/link";
import { Card, EmptyState, PageTitle } from "@/components/app/app-shell";
import { STAFF_ROLES, requireRole } from "@/lib/server/auth";
import { STALE_DAYS, getDashboard } from "@/lib/server/analytics";
import { cn, formatDate, formatEuro } from "@/lib/utils";

export const metadata = { title: "Cruscotto" };

const PERIODS = [
  { days: 30, label: "30 giorni" },
  { days: 90, label: "90 giorni" },
  { days: 365, label: "12 mesi" },
];

function Stat({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="bg-white px-5 py-4">
      <dt className="text-sm text-slate">{label}</dt>
      <dd className="mt-1 font-serif text-3xl text-navy-900 tabular-nums">{value}</dd>
      {note ? <dd className="mt-0.5 text-xs text-slate">{note}</dd> : null}
    </div>
  );
}

/** Barre orizzontali a serie singola: il valore è sempre scritto accanto alla barra. */
function Bars({ rows, unit }: { rows: { label: string; value: number }[]; unit: string }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <ul className="space-y-3">
      {rows.map((r) => (
        <li key={r.label} title={`${r.label}: ${r.value} ${unit}`}>
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="text-navy-900">{r.label}</span>
            <span className="font-medium text-navy-900 tabular-nums">{r.value}</span>
          </div>
          <div className="mt-1 h-1.5 rounded-full bg-line" aria-hidden>
            {r.value > 0 ? <div className="h-full rounded-full bg-teal-700" style={{ width: `${(r.value / max) * 100}%` }} /> : null}
          </div>
        </li>
      ))}
    </ul>
  );
}

const hoursLabel = (h: number | null) => {
  if (h === null) return "—";
  return h < 48 ? `${Math.round(h)} h` : `${Math.round(h / 24)} g`;
};

export default async function DashboardPage({ searchParams }: PageProps<"/team/cruscotto">) {
  const viewer = await requireRole(STAFF_ROLES, "/team/accesso");
  const { periodo } = await searchParams;
  const days = PERIODS.find((p) => String(p.days) === periodo)?.days ?? 30;
  const d = getDashboard(viewer, days);

  return (
    <>
      <PageTitle
        title="Cruscotto"
        description={viewer.role === "amministratore" ? "I numeri dell'intera attività." : "I numeri delle pratiche assegnate a te e di quelle da assegnare."}
        actions={
          <nav aria-label="Periodo" className="flex gap-1 rounded-md border border-line bg-white p-1">
            {PERIODS.map((p) => (
              <Link
                key={p.days}
                href={`/team/cruscotto?periodo=${p.days}`}
                aria-current={p.days === days ? "page" : undefined}
                className={cn(
                  "inline-flex min-h-9 items-center rounded px-3 text-sm",
                  p.days === days ? "bg-navy-900 text-ivory" : "text-navy-900 hover:bg-ivory",
                )}
              >
                {p.label}
              </Link>
            ))}
          </nav>
        }
      />

      <dl className="mb-6 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-line bg-line lg:grid-cols-5">
        <Stat label="Richieste ricevute" value={String(d.received)} note={`Preventivi: ${d.quotes}`} />
        <Stat label="Pratiche aperte" value={String(d.open)} note="In tutte le fasi" />
        <Stat label="Primo contatto" value={hoursLabel(d.medianFirstContactHours)} note="Tempo mediano" />
        <Stat
          label="Conversione"
          value={d.conversion === null ? "—" : `${Math.round(d.conversion * 100)}%`}
          note={`Erogate: ${d.wonCount} su ${d.closedCount} chiuse`}
        />
        <Stat label="Erogato" value={formatEuro(d.disbursed)} note="Finanziamenti registrati" />
      </dl>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card title="Pratiche aperte per fase">
          <Bars rows={d.funnel} unit="pratiche" />
        </Card>
        <Card title="Carico per consulente">
          {d.byConsultant.length ? <Bars rows={d.byConsultant} unit="pratiche aperte" /> : <EmptyState title="Nessuna pratica aperta" />}
        </Card>
        <Card title="Richieste per canale">
          {d.byChannel.length ? <Bars rows={d.byChannel} unit="richieste" /> : <EmptyState title="Nessuna richiesta nel periodo" />}
          <p className="mt-4 border-t border-line pt-3 text-xs text-slate">
            Per misurare una convenzione usa un link con il codice, per esempio <code>/richiesta-preventivo?canale=nome-ente</code>.
          </p>
        </Card>
      </div>

      <Card title={`Pratiche ferme da più di ${STALE_DAYS} giorni`} className="mt-6">
        {d.stale.length ? (
          <ul className="divide-y divide-line">
            {d.stale.slice(0, 15).map((r) => (
              <li key={r.id} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 py-2.5 first:pt-0 last:pb-0">
                <Link href={`/team/pratiche/${r.id}`} className="font-medium text-navy-900 hover:text-teal-700 hover:underline">
                  {r.contact.fullName}
                </Link>
                <span className="text-sm text-slate">Ultimo aggiornamento: {formatDate(r.updatedAt)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState title="Nessuna pratica ferma" />
        )}
      </Card>
    </>
  );
}
