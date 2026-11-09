import { Card, EmptyState, PageTitle } from "@/components/app/app-shell";
import { AppointmentBadge } from "@/components/app/status";
import { MEETING_MODES } from "@/lib/domain";
import { requireRole } from "@/lib/server/auth";
import { getClientOverview } from "@/lib/server/repository";
import { formatDateTime } from "@/lib/utils";

export const metadata = { title: "Appuntamenti" };

type ClientAppointment = NonNullable<ReturnType<typeof getClientOverview>>["appointments"][number];

function List({ items }: { items: ClientAppointment[] }) {
  return (
    <ul className="divide-y divide-line">
      {items.map((a) => (
        <li key={a.id} className="flex flex-col gap-2 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-medium text-navy-900">{formatDateTime(a.startsAt)}</p>
            <p className="text-sm text-slate">
              {MEETING_MODES[a.mode]}
              {a.note ? ` · ${a.note}` : ""}
            </p>
          </div>
          <AppointmentBadge status={a.status} />
        </li>
      ))}
    </ul>
  );
}

export default async function ClientAppointmentsPage() {
  const viewer = await requireRole(["cliente"], "/area-clienti/accesso");
  const overview = getClientOverview(viewer);
  const now = new Date();
  const appts = overview?.appointments ?? [];
  const upcoming = appts.filter((a) => new Date(a.startsAt) >= now);
  const past = appts.filter((a) => new Date(a.startsAt) < now).reverse();

  return (
    <>
      <PageTitle
        title="Appuntamenti"
        description="Le telefonate con il tuo consulente. Per prenotarne una usa il link nell'email con il preventivo; per spostarla, rispondi a quell'email."
      />
      <div className="space-y-6">
        <Card title="In programma">
          {upcoming.length ? <List items={upcoming} /> : <EmptyState title="Nessun appuntamento in programma" />}
        </Card>
        <Card title="Passati">{past.length ? <List items={past} /> : <EmptyState title="Nessun appuntamento passato" />}</Card>
      </div>
    </>
  );
}
