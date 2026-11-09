import Link from "next/link";
import { EmptyState, PageTitle } from "@/components/app/app-shell";
import { AppointmentBadge } from "@/components/app/status";
import { MEETING_MODES } from "@/lib/domain";
import { STAFF_ROLES, requireRole } from "@/lib/server/auth";
import { listAppointmentsForStaff } from "@/lib/server/repository";
import { getUser } from "@/lib/server/store";
import { formatDateTime } from "@/lib/utils";

export const metadata = { title: "Appuntamenti" };

type Item = ReturnType<typeof listAppointmentsForStaff>[number];

function Section({ title, list }: { title: string; list: Item[] }) {
  return (
    <section aria-labelledby={`${title}-h`} className="rounded-lg border border-line bg-white">
      <h2 id={`${title}-h`} className="border-b border-line px-5 py-4 font-semibold text-navy-900">
        {title}
      </h2>
      {list.length === 0 ? (
        <div className="p-5"><EmptyState title="Nessun appuntamento" /></div>
      ) : (
        <ul className="divide-y divide-line">
          {list.map(({ appt, request }) => (
            <li key={appt.id} className="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-medium text-navy-900">{formatDateTime(appt.startsAt)}</p>
                <p className="text-sm text-slate">
                  <Link href={`/team/pratiche/${request.id}`} className="text-teal-700 hover:underline">
                    {request.contact.fullName}
                  </Link>{" "}
                  · {MEETING_MODES[appt.mode]} · {appt.staffId ? getUser(appt.staffId)?.name : "consulente da definire"}
                </p>
              </div>
              <AppointmentBadge status={appt.status} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default async function PanelAppointments() {
  const viewer = await requireRole(STAFF_ROLES, "/team/accesso");
  const now = new Date();
  const items = listAppointmentsForStaff(viewer);
  const upcoming = items.filter(({ appt }) => new Date(appt.startsAt) >= now && appt.status !== "annullato");
  const past = items.filter(({ appt }) => new Date(appt.startsAt) < now || appt.status === "annullato").reverse();

  return (
    <>
      <PageTitle
        title="Appuntamenti"
        description="Il calendario esterno non è collegato: gli appuntamenti sono gestiti nello spazio team e confermati con il cliente."
      />
      <div className="space-y-6">
        <Section title="In programma" list={upcoming} />
        <Section title="Passati o annullati" list={past} />
      </div>
    </>
  );
}
