import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ContentSectionView, CtaBand, FaqList, PageHeader } from "@/components/content/blocks";
import { ReviewNote } from "@/components/content/review";
import { RequestConfigurator } from "@/components/simulator/request-configurator";
import { Button } from "@/components/ui/button";
import { Container, Section, SectionHeading } from "@/components/ui/primitives";
import type { ProductContent } from "@/content/products";

export function ProductPage({ content }: { content: ProductContent }) {
  const tones = ["paper", "ivory"] as const;
  const primary = { href: `/richiesta-preventivo?soluzione=${content.solution}`, label: "Richiedi un preventivo" };

  return (
    <>
      <PageHeader
        eyebrow={content.eyebrow}
        title={content.title}
        lead={content.lead}
        crumbs={[{ href: `/${content.slug}`, label: content.eyebrow }]}
        aside={
          <div className="rounded-lg border border-line bg-white p-6 shadow-soft">
            <p className="text-xs font-semibold tracking-[0.14em] text-brass-700 uppercase">In sintesi</p>
            <dl className="mt-4 divide-y divide-line">
              {content.facts.map((f) => (
                <div key={f.label} className="py-3.5 first:pt-0 last:pb-0">
                  <dt className="text-sm text-slate">{f.label}</dt>
                  <dd className="mt-0.5 leading-snug font-medium text-navy-900">{f.value}</dd>
                </div>
              ))}
            </dl>
            {content.factsReview ? <ReviewNote className="mt-5">{content.factsReview}</ReviewNote> : null}
          </div>
        }
      >
        <Button asChild size="lg">
          <Link href={primary.href}>
            {primary.label}
            <ArrowRight aria-hidden />
          </Link>
        </Button>
      </PageHeader>

      <nav aria-label="In questa pagina" className="border-b border-line bg-paper">
        <Container>
          <ul className="-mx-1 flex gap-1 overflow-x-auto py-2 text-sm whitespace-nowrap [scrollbar-width:none]">
            {content.sections.map((s) => (
              <li key={s.id}>
                <a href={`#${s.id}`} className="inline-flex min-h-10 items-center rounded-md px-3 text-slate hover:bg-ivory hover:text-navy-900">
                  {s.eyebrow ?? s.title}
                </a>
              </li>
            ))}
            <li>
              <a href="#domande" className="inline-flex min-h-10 items-center rounded-md px-3 text-slate hover:bg-ivory hover:text-navy-900">
                Domande frequenti
              </a>
            </li>
          </ul>
        </Container>
      </nav>

      {content.sections.map((section, i) => (
        <ContentSectionView key={section.id} section={section} tone={tones[i % 2]} />
      ))}

      <Section tone={tones[content.sections.length % 2]} aria-labelledby="config-titolo">
        <Container>
          <SectionHeading
            id="config-titolo"
            eyebrow="Configuratore"
            title="Prepara la tua richiesta"
            intro="Indica importo e durata che hai in mente. Non calcoliamo rate né costi: li definisce il finanziatore dopo la valutazione."
          />
          <RequestConfigurator className="mt-10" defaultSolution={content.solution} headingLevel="h3" />
        </Container>
      </Section>

      <Section tone={tones[(content.sections.length + 1) % 2]} id="domande" aria-labelledby="domande-titolo">
        <Container className="grid gap-10 lg:grid-cols-[1fr_1.6fr] lg:gap-16">
          <SectionHeading id="domande-titolo" eyebrow="Domande frequenti" title={`${content.eyebrow}: le domande più comuni`} />
          <FaqList items={content.faqs} />
        </Container>
      </Section>

      <CtaBand title={content.cta.title} text={content.cta.text} primary={primary} />
    </>
  );
}
