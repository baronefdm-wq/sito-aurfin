import "server-only";
import { STATUSES, type RequestStatus } from "@/lib/domain";
import { isClosed } from "@/lib/case-summary";
import type { Viewer } from "@/lib/server/auth";
import { listRequests } from "@/lib/server/repository";
import { getUser } from "@/lib/server/store";

/** Numeri di gestione, calcolati solo sulle pratiche visibili al ruolo. */

const median = (values: number[]) => {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
};

const countBy = <T,>(items: T[], key: (item: T) => string) => {
  const map = new Map<string, number>();
  items.forEach((i) => map.set(key(i), (map.get(key(i)) ?? 0) + 1));
  return [...map.entries()].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);
};

export const STALE_DAYS = 7;

export function getDashboard(viewer: Viewer, periodDays: number) {
  const now = Date.now();
  const all = listRequests(viewer);
  const inPeriod = all.filter((r) => now - new Date(r.createdAt).getTime() <= periodDays * 86_400_000);
  const quotes = inPeriod.filter((r) => r.kind === "preventivo");

  const contactTimes = inPeriod
    .filter((r) => r.firstContactAt)
    .map((r) => (new Date(r.firstContactAt!).getTime() - new Date(r.createdAt).getTime()) / 3_600_000)
    .filter((h) => h >= 0);

  const closed = quotes.filter((r) => isClosed(r.status));
  const won = closed.filter((r) => r.contract);

  const open = all.filter((r) => !isClosed(r.status));
  const stale = open
    .filter((r) => now - new Date(r.updatedAt).getTime() > STALE_DAYS * 86_400_000)
    .sort((a, b) => a.updatedAt.localeCompare(b.updatedAt));

  const funnelOrder: RequestStatus[] = ["nuova", "contattato", "consulenza", "documenti", "valutazione", "proposta"];

  return {
    periodDays,
    received: inPeriod.length,
    quotes: quotes.length,
    open: open.length,
    medianFirstContactHours: median(contactTimes),
    closedCount: closed.length,
    wonCount: won.length,
    conversion: closed.length ? won.length / closed.length : null,
    disbursed: all.filter((r) => r.contract && now - new Date(r.contract.disbursedAt).getTime() <= periodDays * 86_400_000).reduce((sum, r) => sum + r.contract!.amount, 0),
    funnel: funnelOrder.map((s) => ({ label: STATUSES[s].label, value: open.filter((r) => r.status === s).length })),
    byChannel: countBy(inPeriod, (r) => r.channel ?? "Sito (diretto)"),
    byConsultant: countBy(open, (r) => (r.assigneeId ? (getUser(r.assigneeId)?.name ?? "—") : "Da assegnare")),
    stale,
  };
}
