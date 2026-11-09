import Link from "next/link";
import { Search } from "lucide-react";
import { EmptyState, PageTitle } from "@/components/app/app-shell";
import { StatusBadge } from "@/components/app/status";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/form-controls";
import { Badge } from "@/components/ui/primitives";
import { REQUEST_KINDS, SOLUTIONS, STATUSES, type RequestKind, type RequestStatus, type Solution } from "@/lib/domain";
import { STAFF_ROLES, requireRole } from "@/lib/server/auth";
import { getPanelStats, listRequests, type RequestFilters } from "@/lib/server/repository";
import { getUser } from "@/lib/server/store";
import { formatDateTime, formatEuro } from "@/lib/utils";
import { documentProgress, formatWaiting, isClosed, readiness, waitingHours } from "@/lib/case-summary";
import { firstContactHours } from "@/lib/server/jobs";

export const metadata = { title: "Richieste e pratiche" };

const pick = (v: string | string[] | undefined) => (typeof v === "string" ? v : "");

function PriorityNote({ request, alertHours }: { request: Parameters<typeof readiness>[0]; alertHours: number }) {
  if (isClosed(request.status)) return null;
  const hours = waitingHours(request);
  return (
    <p className="mt-1 text-xs text-slate">
      {hours >= alertHours ? <span className="font-semibold text-danger">In attesa da {formatWaiting(hours)} · </span> : null}
      {readiness(request).label}
    </p>
  );
}

function DocsCell({ documents }: { documents: Parameters<typeof documentProgress>[0]["documents"] }) {
  const p = documentProgress({ documents });
  if (!p.total) return <span className="text-sm text-slate">—</span>;
  return (
    <div className="min-w-24">
      <div className="flex items-center gap-2">
        <div className="h-1.5 w-16 overflow-hidden rounded-full bg-line" aria-hidden>
          <div className="h-full rounded-full bg-teal-700" style={{ width: `${p.percent}%` }} />
        </div>
        <span className="text-sm text-navy-900 tabular-nums">
          {p.received}/{p.total}
        </span>
      </div>
      <p className="mt-0.5 text-xs text-slate">
        {p.missing.length ? `${p.missing.length} ${p.missing.length === 1 ? "mancante" : "mancanti"}` : "Completi"}
        {p.toCheck.length ? ` · ${p.toCheck.length} da verificare` : ""}
      </p>
    </div>
  );
}

export default async function PanelHome({ searchParams }: PageProps<"/team">) {
  const viewer = await requireRole(STAFF_ROLES, "/team/accesso");
  const sp = await searchParams;
  const has = (o: object, k: string) => Object.hasOwn(o, k);
  const filters: RequestFilters = {
    q: pick(sp.q).slice(0, 80),
    status: (has(STATUSES, pick(sp.stato)) || pick(sp.stato) === "aperte" ? pick(sp.stato) : "") as RequestFilters["status"],
    kind: (has(REQUEST_KINDS, pick(sp.tipo)) ? pick(sp.tipo) : "") as RequestKind | "",
    solution: (has(SOLUTIONS, pick(sp.soluzione)) ? pick(sp.soluzione) : "") as Solution | "",
    owner: (["mie", "non-assegnate"].includes(pick(sp.assegnazione)) ? pick(sp.assegnazione) : "") as RequestFilters["owner"],
  };
  const alertHours = firstContactHours();
  const byPriority = pick(sp.ordine) !== "recenti";
  const rows = listRequests(viewer, filters);
  if (byPriority) {
    // Prima chi attende il primo contatto da più tempo del previsto, poi le richieste più complete.
    const score = (r: (typeof rows)[number]) => {
      if (isClosed(r.status)) return -1;
      return (waitingHours(r) >= alertHours ? 10 : 0) + (r.status === "nuova" ? 5 : 0) + readiness(r).level;
    };
    rows.sort((a, b) => score(b) - score(a) || b.updatedAt.localeCompare(a.updatedAt));
  }
  const stats = getPanelStats(viewer);
  const hasFilters = Object.values(filters).some(Boolean);

  return (
    <>
      <PageTitle
        title="Richieste e pratiche"
        description={
          viewer.role === "amministratore"
            ? "Tutte le richieste ricevute. Come amministratore puoi assegnarle ai consulenti."
            : "Le pratiche assegnate a te e le richieste non ancora assegnate."
        }
      />

      <dl className="mb-8 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-4">
        {[
          ["Aperte", stats.open],
          ["Non assegnate", stats.unassigned],
          [viewer.role === "consulente" ? "Assegnate a me" : "Assegnate a te", stats.mine],
          ["Ricevute oggi", stats.newToday],
        ].map(([label, value]) => (
          <div key={label as string} className="bg-white px-5 py-4">
            <dt className="text-sm text-slate">{label}</dt>
            <dd className="mt-1 font-serif text-3xl text-navy-900 tabular-nums">{value}</dd>
          </div>
        ))}
      </dl>

      <form role="search" aria-label="Filtra le richieste" className="mb-6 grid gap-3 rounded-lg border border-line bg-white p-4 sm:grid-cols-2 xl:grid-cols-[2fr_1fr_1fr_1fr_1fr_auto]">
        <div className="relative sm:col-span-2 xl:col-span-1">
          <label htmlFor="q" className="sr-only">
            Cerca per nome, email, telefono o codice
          </label>
          <Search aria-hidden className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-slate" />
          <Input id="q" name="q" defaultValue={filters.q} placeholder="Nome, email, telefono o codice" className="pl-10" />
        </div>
        <div>
          <label htmlFor="stato" className="sr-only">Stato</label>
          <Select id="stato" name="stato" defaultValue={filters.status}>
            <option value="">Tutti gli stati</option>
            <option value="aperte">Solo aperte</option>
            {(Object.keys(STATUSES) as RequestStatus[]).map((s) => (
              <option key={s} value={s}>{STATUSES[s].label}</option>
            ))}
          </Select>
        </div>
        <div>
          <label htmlFor="tipo" className="sr-only">Tipo</label>
          <Select id="tipo" name="tipo" defaultValue={filters.kind}>
            <option value="">Tutti i tipi</option>
            {(Object.keys(REQUEST_KINDS) as RequestKind[]).map((k) => (
              <option key={k} value={k}>{REQUEST_KINDS[k]}</option>
            ))}
          </Select>
        </div>
        <div>
          <label htmlFor="soluzione" className="sr-only">Soluzione</label>
          <Select id="soluzione" name="soluzione" defaultValue={filters.solution}>
            <option value="">Tutte le soluzioni</option>
            {(Object.keys(SOLUTIONS) as Solution[]).map((k) => (
              <option key={k} value={k}>{SOLUTIONS[k]}</option>
            ))}
          </Select>
        </div>
        <div>
          <label htmlFor="assegnazione" className="sr-only">Assegnazione</label>
          <Select id="assegnazione" name="assegnazione" defaultValue={filters.owner}>
            <option value="">Qualsiasi assegnazione</option>
            <option value="mie">Assegnate a me</option>
            <option value="non-assegnate">Non assegnate</option>
          </Select>
        </div>
        <div className="flex gap-2">
          {byPriority ? null : <input type="hidden" name="ordine" value="recenti" />}
          <Button type="submit" className="h-12 flex-1">Filtra</Button>
          {hasFilters ? (
            <Button asChild variant="quiet" className="h-12">
              <Link href="/team">Azzera</Link>
            </Button>
          ) : null}
        </div>
      </form>

      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate" role="status">
          {rows.length} {rows.length === 1 ? "risultato" : "risultati"} · ordinati per {byPriority ? "priorità" : "aggiornamento"}{" "}
          <Link
            href={byPriority ? "/team?ordine=recenti" : "/team"}
            className="font-medium text-teal-700 underline underline-offset-2"
          >
            {byPriority ? "Ordina per aggiornamento" : "Ordina per priorità"}
          </Link>
        </p>
        {viewer.role === "amministratore" ? (
          <a href="/api/team/esporta" className="text-sm font-medium text-teal-700 underline underline-offset-2">
            Esporta in CSV
          </a>
        ) : null}
      </div>
      <p className="mb-3 text-xs text-slate">
        La priorità considera attesa e completezza dei dati. Non è una valutazione del cliente né del merito creditizio.
      </p>

      {rows.length === 0 ? (
        <EmptyState title="Nessuna richiesta corrisponde ai filtri" text="Prova a modificare o azzerare i filtri." />
      ) : (
        <>
          {/* Tabella: tablet e desktop */}
          <div className="hidden overflow-hidden rounded-lg border border-line bg-white md:block">
            <table className="w-full text-left text-[0.9375rem]">
              <caption className="sr-only">Elenco richieste</caption>
              <thead className="border-b border-line bg-paper text-sm text-slate">
                <tr>
                  <th scope="col" className="px-4 py-3 font-medium">Richiedente</th>
                  <th scope="col" className="px-4 py-3 font-medium">Tipo e soluzione</th>
                  <th scope="col" className="hidden px-4 py-3 font-medium xl:table-cell">Importo e durata</th>
                  <th scope="col" className="px-4 py-3 font-medium">Documenti</th>
                  <th scope="col" className="px-4 py-3 font-medium">Stato</th>
                  <th scope="col" className="px-4 py-3 font-medium">Assegnata a</th>
                  <th scope="col" className="hidden px-4 py-3 font-medium lg:table-cell">Aggiornata</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {rows.map((r) => (
                  // Riga interamente cliccabile: il link sul nome si estende a tutta la riga.
                  <tr key={r.id} className="relative transition-colors hover:bg-ivory focus-within:bg-ivory">
                    <td className="px-4 py-3.5">
                      <Link
                        href={`/team/pratiche/${r.id}`}
                        className="font-medium text-navy-900 after:absolute after:inset-0 hover:text-teal-700 hover:underline"
                      >
                        {r.contact.fullName}
                      </Link>
                      <p className="text-sm text-slate tabular-nums">{r.reference}</p>
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="text-navy-900">{REQUEST_KINDS[r.kind]}</p>
                      <p className="text-sm text-slate">{r.solution ? SOLUTIONS[r.solution] : "—"}</p>
                    </td>
                    <td className="hidden px-4 py-3.5 tabular-nums xl:table-cell">
                      {r.amount ? formatEuro(r.amount) : "—"}
                      {r.durationMonths ? <span className="block text-sm text-slate">{r.durationMonths} mesi</span> : null}
                    </td>
                    <td className="px-4 py-3.5">
                      <DocsCell documents={r.documents} />
                    </td>
                    <td className="px-4 py-3.5">
                      <StatusBadge status={r.status} />
                      <PriorityNote request={r} alertHours={alertHours} />
                    </td>
                    <td className="px-4 py-3.5">
                      {r.assigneeId ? getUser(r.assigneeId)?.name : <Badge tone="brass">Da assegnare</Badge>}
                    </td>
                    <td className="hidden px-4 py-3.5 text-sm text-slate lg:table-cell">{formatDateTime(r.updatedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Elenco: mobile */}
          <ul className="space-y-3 md:hidden">
            {rows.map((r) => (
              <li key={r.id}>
                <Link href={`/team/pratiche/${r.id}`} className="block rounded-lg border border-line bg-white p-4 active:bg-ivory">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-navy-900">{r.contact.fullName}</p>
                      <p className="text-sm text-slate tabular-nums">{r.reference}</p>
                    </div>
                    <StatusBadge status={r.status} />
                  </div>
                  <PriorityNote request={r} alertHours={alertHours} />
                  <p className="mt-3 text-sm text-navy-900">
                    {REQUEST_KINDS[r.kind]}
                    {r.solution ? ` · ${SOLUTIONS[r.solution]}` : ""}
                  </p>
                  <p className="mt-1 text-sm text-slate">
                    {r.assigneeId ? `Assegnata a ${getUser(r.assigneeId)?.name}` : "Da assegnare"} · {formatDateTime(r.updatedAt)}
                  </p>
                  {r.documents.length ? (
                    <div className="mt-2">
                      <DocsCell documents={r.documents} />
                    </div>
                  ) : null}
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </>
  );
}
