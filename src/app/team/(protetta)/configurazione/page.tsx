import { CheckCircle2, CircleDashed, TriangleAlert } from "lucide-react";
import { Card, PageTitle } from "@/components/app/app-shell";
import { Badge, Notice } from "@/components/ui/primitives";
import { getMissingSiteData, publicationBlockers, site } from "@/config/site";
import { legalPages } from "@/content/legal";
import { guides } from "@/content/guides";
import { requireRole } from "@/lib/server/auth";
import { DATA_MODE, getIntegrationStatus } from "@/lib/server/env";

export const metadata = { title: "Pubblicazione e integrazioni" };

export default async function ConfigPage() {
  // Solo amministratori: il controllo è sul server, non sul menu.
  await requireRole(["amministratore"], "/team/accesso");
  const missing = getMissingSiteData();
  const integrations = getIntegrationStatus();
  const drafts = guides.filter((g) => g.status === "bozza");

  return (
    <>
      <PageTitle
        title="Pubblicazione e integrazioni"
        description="Cosa manca per pubblicare il sito e rendere operative le funzioni oggi dimostrative."
      />

      <div className="space-y-6">
        <Card title="Verifiche bloccanti emerse dai documenti societari">
          <ul className="space-y-3">
            {publicationBlockers.map((b) => (
              <li key={b} className="flex gap-3 text-navy-900">
                <TriangleAlert aria-hidden className="mt-0.5 size-5 shrink-0 text-brass-700" />
                {b}
              </li>
            ))}
          </ul>
        </Card>

        <div className="grid gap-6 xl:grid-cols-2">
          <Card title="Dati aziendali mancanti" action={<Badge tone={missing.length ? "brass" : "teal"}>{missing.length}</Badge>}>
            {missing.length === 0 ? (
              <p className="text-navy-900">Tutti i dati configurati.</p>
            ) : (
              <ul className="space-y-2">
                {missing.map((m) => (
                  <li key={m.label} className="flex items-start gap-2.5">
                    <CircleDashed aria-hidden className="mt-0.5 size-4 shrink-0 text-brass-700" />
                    <span>
                      <span className="text-navy-900">{m.label}</span>
                      <span className="text-sm text-slate"> · {m.area}</span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-5 border-t border-line pt-4 text-sm text-slate">
              Da compilare in <code className="rounded bg-ivory px-1.5 py-0.5">src/config/site.ts</code>.
            </p>
          </Card>

          <Card title="Integrazioni" action={<Badge tone="navy">Modalità: {DATA_MODE}</Badge>}>
            <ul className="divide-y divide-line">
              {integrations.map((i) => (
                <li key={i.key} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
                  {i.configured ? (
                    <CheckCircle2 aria-hidden className="mt-0.5 size-5 shrink-0 text-teal-700" />
                  ) : (
                    <CircleDashed aria-hidden className="mt-0.5 size-5 shrink-0 text-slate" />
                  )}
                  <div>
                    <p className="font-medium text-navy-900">
                      {i.label} <span className="sr-only">{i.configured ? "configurata" : "non configurata"}</span>
                    </p>
                    <p className="text-sm text-slate">{i.note}</p>
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        </div>

        <Card title="Testi da approvare">
          <ul className="space-y-2 text-navy-900">
            <li>Pagine legali in bozza: {Object.values(legalPages).map((p) => p.title).join(" · ")}</li>
            <li>Guide in bozza: {drafts.length}</li>
            <li>Contenuti prodotto e FAQ segnati «Da validare» (cessione del quinto, delega, prestiti personali)</li>
            <li>Impegni di servizio in home page e descrizione del ruolo in «Chi siamo»</li>
          </ul>
        </Card>

        {site.reviewMode ? (
          <Notice tone="warning" title="Modalità revisione attiva">
            Segnaposto e note «Da validare» sono visibili nel sito. Per la pubblicazione impostare
            NEXT_PUBLIC_REVIEW_MODE=false dopo aver completato i dati.
          </Notice>
        ) : null}
      </div>
    </>
  );
}
