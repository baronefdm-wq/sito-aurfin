import Link from "next/link";
import { Card, EmptyState, PageTitle } from "@/components/app/app-shell";
import { Button } from "@/components/ui/button";
import { Badge, Notice } from "@/components/ui/primitives";
import { openRenewal, renewalContacted } from "@/app/team/actions";
import { SOLUTIONS } from "@/lib/domain";
import { STAFF_ROLES, requireRole } from "@/lib/server/auth";
import { canManage, listRenewals } from "@/lib/server/repository";
import { formatDate, formatEuro } from "@/lib/utils";

export const metadata = { title: "Rinnovi" };

export default async function RenewalsPage() {
  const viewer = await requireRole(STAFF_ROLES, "/team/accesso");
  const rows = listRenewals(viewer);
  const groups = [
    { title: "Rinnovabili ora", items: rows.filter((r) => r.daysToRenewal <= 0 && !r.renewed) },
    { title: "Entro 90 giorni", items: rows.filter((r) => r.daysToRenewal > 0 && r.daysToRenewal <= 90 && !r.renewed) },
    { title: "Più avanti", items: rows.filter((r) => r.daysToRenewal > 90 && !r.renewed) },
    { title: "Già rinnovati", items: rows.filter((r) => r.renewed) },
  ];

  return (
    <>
      <PageTitle
        title="Rinnovi"
        description="I finanziamenti erogati e la data da cui potrebbero essere rinnovati. Si alimenta registrando il finanziamento nella scheda della pratica."
      />
      <Notice tone="warning" title="Prima di contattare un cliente" className="mb-6">
        La data è una stima (2/5 della durata) da verificare con il mandante. Proporre un rinnovo è un contatto commerciale:
        controlla il consenso indicato accanto a ogni nome e la regola da applicare con il consulente privacy.
      </Notice>

      {rows.length === 0 ? (
        <EmptyState title="Nessun finanziamento registrato" text="Apri una pratica conclusa e compila «Finanziamento erogato»." />
      ) : (
        <div className="space-y-6">
          {groups
            .filter((g) => g.items.length)
            .map((g) => (
              <Card key={g.title} title={`${g.title} (${g.items.length})`}>
                <ul className="divide-y divide-line">
                  {g.items.map(({ request: r, renewableAt, endsAt, renewed }) => (
                    <li key={r.id} className="grid gap-3 py-4 first:pt-0 last:pb-0 lg:grid-cols-[1.3fr_1.4fr_auto] lg:items-center">
                      <div>
                        <Link href={`/team/pratiche/${r.id}`} className="font-medium text-navy-900 hover:text-teal-700 hover:underline">
                          {r.contact.fullName}
                        </Link>
                        <p className="text-sm text-slate">
                          {r.solution ? SOLUTIONS[r.solution] : "—"} · {r.contract!.lender}
                        </p>
                        <div className="mt-1.5 flex flex-wrap gap-1.5">
                          {r.marketingConsent ? <Badge tone="teal">Consenso commerciale: sì</Badge> : <Badge tone="muted">Consenso commerciale: no</Badge>}
                          {r.contract!.renewalContactedAt ? <Badge>Contattato il {formatDate(r.contract!.renewalContactedAt)}</Badge> : null}
                        </div>
                      </div>
                      <dl className="grid grid-cols-3 gap-3 text-sm">
                        <div>
                          <dt className="text-slate">Importo</dt>
                          <dd className="text-navy-900 tabular-nums">{formatEuro(r.contract!.amount)}</dd>
                        </div>
                        <div>
                          <dt className="text-slate">Rinnovo dal</dt>
                          <dd className="text-navy-900">{formatDate(renewableAt)}</dd>
                        </div>
                        <div>
                          <dt className="text-slate">Scadenza</dt>
                          <dd className="text-navy-900">{formatDate(endsAt)}</dd>
                        </div>
                      </dl>
                      {canManage(viewer, r) && !renewed ? (
                        <div className="flex flex-wrap gap-2 lg:justify-end">
                          {!r.contract!.renewalContactedAt ? (
                            <form action={renewalContacted}>
                              <input type="hidden" name="id" value={r.id} />
                              <Button type="submit" size="sm" variant="secondary">
                                Segna contattato
                              </Button>
                            </form>
                          ) : null}
                          <form action={openRenewal}>
                            <input type="hidden" name="id" value={r.id} />
                            <Button type="submit" size="sm">
                              Apri rinnovo
                            </Button>
                          </form>
                        </div>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </Card>
            ))}
        </div>
      )}
    </>
  );
}
