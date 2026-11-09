import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { ReviewNote } from "@/components/content/review";
import { Accordion } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Container, Eyebrow, Section, SectionHeading } from "@/components/ui/primitives";
import type { ContentSection, FaqItem } from "@/content/products";
import { cn } from "@/lib/utils";

export type Crumb = { href: string; label: string };

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Percorso" className="text-sm text-slate">
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <li>
          <Link href="/" className="hover:text-navy-900 hover:underline">
            Home
          </Link>
        </li>
        {items.map((c, i) => (
          <li key={c.href} className="flex items-center gap-2">
            <span aria-hidden className="text-line-strong">
              /
            </span>
            {i === items.length - 1 ? (
              <span aria-current="page" className="text-navy-900">
                {c.label}
              </span>
            ) : (
              <Link href={c.href} className="hover:text-navy-900 hover:underline">
                {c.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

/** Intestazione delle pagine interne: titolo editoriale e linea ottone. */
export function PageHeader({
  eyebrow,
  title,
  lead,
  crumbs,
  children,
  aside,
}: {
  eyebrow?: string;
  title: string;
  lead?: string;
  crumbs: Crumb[];
  children?: React.ReactNode;
  aside?: React.ReactNode;
}) {
  return (
    <header className="relative overflow-hidden border-b border-line bg-ivory">
      <DiagonalMotif className="pointer-events-none absolute -right-24 -bottom-10 hidden h-[26rem] text-navy-900/[0.035] md:block" />
      <Container className="relative py-12 sm:py-16 lg:py-20">
        <Breadcrumbs items={crumbs} />
        <div className={cn("mt-8 grid gap-10", aside && "lg:grid-cols-[1.4fr_1fr] lg:items-end")}>
          <div className="max-w-3xl animate-fade-up">
            {eyebrow ? <Eyebrow className="mb-5">{eyebrow}</Eyebrow> : null}
            <h1 className="font-serif text-[2.25rem] leading-[1.1] tracking-[-0.02em] text-balance text-navy-900 sm:text-5xl lg:text-[3.4rem]">
              {title}
            </h1>
            {lead ? <p className="mt-6 text-lg leading-relaxed text-pretty text-slate sm:text-xl">{lead}</p> : null}
            {children ? <div className="mt-8 flex flex-col gap-3 sm:flex-row">{children}</div> : null}
          </div>
          {aside}
        </div>
      </Container>
    </header>
  );
}

/** Motivo grafico derivato dal logo: due diagonali e un arco. */
export function DiagonalMotif({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 340 250" aria-hidden className={className} fill="currentColor">
      <polygon points="0,248 153,0 210,0 63,248" />
      <polygon points="188,82 218,28 338,248 274,248" />
    </svg>
  );
}

export function ContentSectionView({ section, tone = "paper" }: { section: ContentSection; tone?: "paper" | "ivory" | "white" }) {
  const headingId = `${section.id}-titolo`;
  return (
    <Section tone={tone} aria-labelledby={headingId} id={section.id}>
      <Container>
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)] lg:gap-16">
          <div className="lg:sticky lg:top-28 lg:self-start">
            <SectionHeading eyebrow={section.eyebrow} title={section.title} id={headingId} />
            {section.intro ? <p className="mt-5 text-lg leading-relaxed text-slate">{section.intro}</p> : null}
            {section.review ? <ReviewNote className="mt-6">{section.review}</ReviewNote> : null}
          </div>
          <div>
            <SectionBody section={section} />
            {section.footnote ? <p className="mt-6 text-sm text-slate">{section.footnote}</p> : null}
          </div>
        </div>
      </Container>
    </Section>
  );
}

function SectionBody({ section }: { section: ContentSection }) {
  switch (section.layout) {
    case "columns":
      return (
        <ul className="grid gap-x-10 gap-y-8 sm:grid-cols-2">
          {section.items.map((item) => (
            <li key={item.title} className="border-t border-navy-900/80 pt-5">
              <h3 className="text-lg font-semibold text-navy-900">{item.title}</h3>
              <p className="mt-2 leading-relaxed text-slate">{item.text}</p>
            </li>
          ))}
        </ul>
      );
    case "definition":
      return (
        <dl className="divide-y divide-line border-y border-line">
          {section.items.map((item) => (
            <div key={item.title} className="grid gap-2 py-6 sm:grid-cols-[13rem_1fr] sm:gap-8">
              <dt className="font-semibold text-navy-900">{item.title}</dt>
              <dd className="leading-relaxed text-slate">{item.text}</dd>
            </div>
          ))}
        </dl>
      );
    case "list":
      return (
        <ol className="space-y-8">
          {section.items.map((item, i) => (
            <li key={item.title} className="grid grid-cols-[2.5rem_1fr] gap-4">
              <span className="font-serif text-2xl leading-none text-brass-700 tabular-nums">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div>
                <h3 className="text-lg font-semibold text-navy-900">{item.title}</h3>
                <p className="mt-2 leading-relaxed text-slate">{item.text}</p>
              </div>
            </li>
          ))}
        </ol>
      );
    case "checklist":
      return (
        <ul className="divide-y divide-line rounded-lg border border-line bg-white">
          {section.items.map((item) => (
            <li key={item.text} className="flex items-start gap-3.5 px-5 py-4">
              <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-teal-50 text-teal-700">
                <Check aria-hidden className="size-3.5" strokeWidth={2.5} />
              </span>
              <span className="leading-relaxed text-navy-900">{item.text}</span>
            </li>
          ))}
        </ul>
      );
    case "steps":
      return <StepList steps={section.items.map((i) => ({ title: i.title ?? "", text: i.text }))} />;
  }
}

export function StepList({ steps, className }: { steps: { title: string; text: string }[]; className?: string }) {
  return (
    <ol className={cn("relative space-y-0", className)}>
      {steps.map((step, i) => (
        <li key={step.title} className="relative grid grid-cols-[2.75rem_1fr] gap-4 pb-8 last:pb-0">
          {i < steps.length - 1 ? (
            <span aria-hidden className="absolute top-11 bottom-1 left-[1.375rem] w-px -translate-x-1/2 bg-line-strong" />
          ) : null}
          <span className="relative flex size-11 items-center justify-center rounded-full border border-navy-900/20 bg-white font-serif text-lg text-navy-900 tabular-nums">
            {i + 1}
          </span>
          <div className="pt-2">
            <h3 className="text-lg font-semibold text-navy-900">{step.title}</h3>
            <p className="mt-1.5 leading-relaxed text-slate">{step.text}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

export function FaqList({ items, className }: { items: FaqItem[]; className?: string }) {
  return (
    <Accordion
      className={className}
      items={items.map((f) => ({
        id: f.id,
        question: f.question,
        answer: f.answer.map((p, i) => <p key={i}>{p}</p>),
      }))}
    />
  );
}

export function CtaBand({
  title,
  text,
  primary,
  secondary,
}: {
  title: string;
  text: string;
  primary: { href: string; label: string };
  secondary?: { href: string; label: string };
}) {
  return (
    <section className="relative overflow-hidden bg-navy-900 text-ivory" aria-labelledby="cta-titolo">
      <DiagonalMotif className="pointer-events-none absolute -top-10 -right-10 h-80 text-white/[0.04]" />
      <Container className="relative py-16 sm:py-20">
        <div className="grid gap-8 lg:grid-cols-[1.5fr_1fr] lg:items-end">
          <div>
            <h2 id="cta-titolo" className="font-serif text-3xl leading-tight text-balance sm:text-4xl">
              {title}
            </h2>
            <p className="mt-4 max-w-2xl text-lg leading-relaxed text-ivory/80">{text}</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row lg:justify-end">
            <Button asChild variant="inverse" size="lg">
              <Link href={primary.href}>
                {primary.label}
                <ArrowRight aria-hidden />
              </Link>
            </Button>
            {secondary ? (
              <Button asChild variant="inverse-outline" size="lg">
                <Link href={secondary.href}>{secondary.label}</Link>
              </Button>
            ) : null}
          </div>
        </div>
      </Container>
    </section>
  );
}
