import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs, CtaBand } from "@/components/content/blocks";
import { Container, Eyebrow, Notice } from "@/components/ui/primitives";
import { getGuide, guideCategories, guides } from "@/content/guides";
import { formatDate } from "@/lib/utils";

export function generateStaticParams() {
  return guides.map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({ params }: PageProps<"/guide/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const guide = getGuide(slug);
  if (!guide) return {};
  return {
    title: guide.title,
    description: guide.excerpt,
    alternates: { canonical: `/guide/${guide.slug}` },
    // Le bozze non vengono indicizzate.
    robots: guide.status === "bozza" ? { index: false, follow: true } : undefined,
  };
}

export default async function GuidePage({ params }: PageProps<"/guide/[slug]">) {
  const { slug } = await params;
  const guide = getGuide(slug);
  if (!guide) notFound();

  return (
    <>
      <article>
        <header className="border-b border-line bg-ivory">
          <Container className="py-12 sm:py-16">
            <Breadcrumbs
              items={[
                { href: "/guide", label: "Guide" },
                { href: `/guide/${guide.slug}`, label: guide.title },
              ]}
            />
            <div className="mt-8 max-w-3xl">
              <Eyebrow>
                <Link href={`/guide?categoria=${guide.category}`} className="hover:underline">
                  {guideCategories[guide.category]}
                </Link>
              </Eyebrow>
              <h1 className="mt-5 font-serif text-4xl leading-tight tracking-[-0.015em] text-balance text-navy-900 sm:text-5xl">
                {guide.title}
              </h1>
              <p className="mt-5 text-lg leading-relaxed text-slate">{guide.excerpt}</p>
              <p className="mt-6 text-sm text-slate">
                {guide.updatedAt ? `Aggiornata il ${formatDate(guide.updatedAt)} · ` : null}
                Lettura: {guide.readingMinutes} minuti
              </p>
            </div>
          </Container>
        </header>
        <Container className="py-12 sm:py-16">
          {guide.status === "bozza" ? (
            <Notice tone="warning" title="Bozza da verificare prima della pubblicazione" className="mb-10 max-w-[68ch]">
              Questo articolo è un contenuto dimostrativo: va rivisto e approvato prima di essere pubblicato. Non è
              indicizzato dai motori di ricerca.
            </Notice>
          ) : null}
          <div className="prose-aurfin">
            {guide.body.map((block, i) => {
              switch (block.type) {
                case "p":
                  return <p key={i}>{block.text}</p>;
                case "h2":
                  return <h2 key={i}>{block.text}</h2>;
                case "ul":
                  return (
                    <ul key={i}>
                      {block.items.map((it) => (
                        <li key={it}>{it}</li>
                      ))}
                    </ul>
                  );
                case "callout":
                  return (
                    <aside key={i} className="rounded-md border-l-2 border-brass bg-ivory px-5 py-4 text-[0.9875rem] text-navy-900">
                      {block.text}
                    </aside>
                  );
              }
            })}
          </div>
        </Container>
      </article>
      <CtaBand
        title="Vuoi capire cosa vale per la tua situazione?"
        text="Richiedi un preventivo senza impegno: ti rispondiamo via email entro un giorno lavorativo."
        primary={{ href: "/richiesta-preventivo", label: "Richiedi un preventivo" }}
        secondary={{ href: "/guide", label: "Altre guide" }}
      />
    </>
  );
}
