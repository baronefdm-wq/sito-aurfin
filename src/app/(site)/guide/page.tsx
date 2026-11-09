import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { PageHeader } from "@/components/content/blocks";
import { Badge, Container, Section } from "@/components/ui/primitives";
import { guideCategories, guides, type GuideCategory } from "@/content/guides";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Guide",
  description: "Guide pratiche su cessione del quinto, prestiti, documenti ed educazione finanziaria.",
  alternates: { canonical: "/guide" },
};

export default async function GuidesPage({ searchParams }: PageProps<"/guide">) {
  const { categoria } = await searchParams;
  const active = typeof categoria === "string" && Object.hasOwn(guideCategories, categoria) ? (categoria as GuideCategory) : null;
  const list = active ? guides.filter((g) => g.category === active) : guides;

  return (
    <>
      <PageHeader
        eyebrow="Guide"
        title="Capire prima di decidere"
        lead="Approfondimenti pratici per orientarti tra le soluzioni di finanziamento e arrivare alla richiesta con le domande giuste."
        crumbs={[{ href: "/guide", label: "Guide" }]}
      />
      <Section>
        <Container>
          <nav aria-label="Categorie">
            <ul className="flex flex-wrap gap-2">
              <li>
                <Link
                  href="/guide"
                  aria-current={!active ? "page" : undefined}
                  className={cn(
                    "inline-flex min-h-10 items-center rounded-full border px-4 text-sm transition-colors",
                    !active ? "border-navy-900 bg-navy-900 text-ivory" : "border-line-strong text-navy-900 hover:border-navy-700",
                  )}
                >
                  Tutte
                </Link>
              </li>
              {(Object.keys(guideCategories) as GuideCategory[]).map((c) => (
                <li key={c}>
                  <Link
                    href={`/guide?categoria=${c}`}
                    aria-current={active === c ? "page" : undefined}
                    className={cn(
                      "inline-flex min-h-10 items-center rounded-full border px-4 text-sm transition-colors",
                      active === c ? "border-navy-900 bg-navy-900 text-ivory" : "border-line-strong text-navy-900 hover:border-navy-700",
                    )}
                  >
                    {guideCategories[c]}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {list.length === 0 ? (
            <div className="mt-12 rounded-lg border border-dashed border-line-strong p-10 text-center">
              <p className="font-serif text-xl text-navy-900">Nessuna guida in questa categoria, per ora.</p>
              <p className="mt-2 text-slate">Stiamo preparando nuovi contenuti.</p>
              <Link href="/guide" className="mt-4 inline-block font-medium text-teal-700 underline underline-offset-2">
                Vedi tutte le guide
              </Link>
            </div>
          ) : (
            <ul className="mt-12 divide-y divide-line border-y border-line">
              {list.map((g) => (
                <li key={g.slug}>
                  <Link href={`/guide/${g.slug}`} className="group grid gap-3 py-8 sm:grid-cols-[12rem_1fr_auto] sm:gap-8">
                    <div className="flex flex-wrap items-start gap-2 sm:flex-col">
                      <span className="text-sm text-slate">{guideCategories[g.category]}</span>
                      {g.status === "bozza" ? <Badge tone="brass">Bozza da verificare</Badge> : null}
                    </div>
                    <div>
                      <h2 className="font-serif text-2xl leading-snug text-navy-900 transition-colors group-hover:text-teal-700">
                        {g.title}
                      </h2>
                      <p className="mt-2 leading-relaxed text-slate">{g.excerpt}</p>
                      <p className="mt-3 text-sm text-slate">Lettura: {g.readingMinutes} minuti</p>
                    </div>
                    <ArrowUpRight
                      aria-hidden
                      className="hidden size-5 text-navy-900 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 sm:block"
                    />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Container>
      </Section>
    </>
  );
}
