import type { Metadata } from "next";
import { PageHeader } from "@/components/content/blocks";
import { Placeholder } from "@/components/content/review";
import { Container, Section } from "@/components/ui/primitives";
import { site } from "@/config/site";
import { legalPages } from "@/content/legal";

export function legalMetadata(slug: string): Metadata {
  const page = legalPages[slug];
  return { title: page.title, description: page.description, alternates: { canonical: `/${slug}` } };
}

export function LegalPageView({ slug }: { slug: string }) {
  const page = legalPages[slug];
  return (
    <>
      <PageHeader eyebrow="Informazioni" title={page.title} lead={page.intro} crumbs={[{ href: `/${slug}`, label: page.title }]} />
      <Section>
        <Container className="grid gap-12 lg:grid-cols-[14rem_1fr] lg:gap-16">
          <nav aria-label="Indice" className="lg:sticky lg:top-28 lg:self-start">
            <p className="text-xs font-semibold tracking-[0.14em] text-brass-700 uppercase">Indice</p>
            <ol className="mt-3 space-y-1 text-[0.9375rem]">
              {page.sections.map((s) => (
                <li key={s.id}>
                  <a href={`#${s.id}`} className="inline-flex min-h-9 items-center text-navy-900 hover:text-teal-700 hover:underline">
                    {s.title}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
          <div>
            <div className="prose-aurfin [&>section:first-child>h2]:mt-0 [&>section>*+*]:mt-[1.1em]">
              {page.sections.map((s) => (
                <section key={s.id} id={s.id} aria-labelledby={`${s.id}-t`}>
                  <h2 id={`${s.id}-t`}>{s.title}</h2>
                  {s.blocks.map((b, i) =>
                    b.type === "p" ? (
                      <p key={i}>{b.text}</p>
                    ) : b.type === "ul" ? (
                      <ul key={i}>
                        {b.items.map((it) => (
                          <li key={it}>{it}</li>
                        ))}
                      </ul>
                    ) : site.reviewMode ? (
                      <p key={i}>
                        <Placeholder>{b.text}</Placeholder>
                      </p>
                    ) : null,
                  )}
                </section>
              ))}
            </div>
            {site.reviewMode ? (
              <aside aria-labelledby="checklist-t" className="mt-14 max-w-[68ch] rounded-lg border border-dashed border-brass bg-brass-100/40 p-6">
                <h2 id="checklist-t" className="text-sm font-bold tracking-wider text-brass-700 uppercase">
                  Checklist per la pubblicazione
                </h2>
                <ul className="mt-4 space-y-2.5">
                  {page.checklist.map((item) => (
                    <li key={item} className="flex gap-3 text-[0.9375rem] text-navy-900">
                      <span aria-hidden className="mt-1 size-4 shrink-0 rounded-sm border border-brass-700" />
                      {item}
                    </li>
                  ))}
                </ul>
              </aside>
            ) : null}
          </div>
        </Container>
      </Section>
    </>
  );
}
