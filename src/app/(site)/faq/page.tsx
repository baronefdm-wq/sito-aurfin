import type { Metadata } from "next";
import { CtaBand, FaqList, PageHeader } from "@/components/content/blocks";
import { Container, Section } from "@/components/ui/primitives";
import { faqCategories } from "@/content/faq";

export const metadata: Metadata = {
  title: "Domande frequenti",
  description:
    "Risposte su cessione del quinto, prestito per delega, prestiti personali, documenti, avanzamento della richiesta, privacy e assistenza.",
  alternates: { canonical: "/faq" },
};

export default function FaqPage() {
  return (
    <>
      <PageHeader
        eyebrow="Domande frequenti"
        title="Le risposte, organizzate per argomento"
        lead="Se non trovi quello che cerchi, scrivici: rispondiamo anche alle domande più semplici."
        crumbs={[{ href: "/faq", label: "FAQ" }]}
      />
      <Section>
        <Container className="grid gap-12 lg:grid-cols-[15rem_1fr] lg:gap-16">
          <nav aria-label="Argomenti" className="lg:sticky lg:top-28 lg:self-start">
            <p className="text-xs font-semibold tracking-[0.14em] text-brass-700 uppercase">Argomenti</p>
            <ul className="mt-3 flex flex-wrap gap-2 lg:flex-col lg:gap-0.5">
              {faqCategories.map((c) => (
                <li key={c.id}>
                  <a
                    href={`#${c.id}`}
                    className="inline-flex min-h-10 items-center rounded-md border border-line px-3 text-[0.9375rem] text-navy-900 hover:bg-ivory lg:border-0"
                  >
                    {c.title}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          <div className="space-y-16">
            {faqCategories.map((c) => (
              <section key={c.id} id={c.id} aria-labelledby={`${c.id}-titolo`}>
                <h2 id={`${c.id}-titolo`} className="mb-4 font-serif text-2xl text-navy-900 sm:text-3xl">
                  {c.title}
                </h2>
                <FaqList items={c.items} />
              </section>
            ))}
          </div>
        </Container>
      </Section>
      <CtaBand
        title="Hai una domanda specifica?"
        text="Scrivici via email: ti rispondiamo con chiarezza, senza impegno."
        primary={{ href: "/contatti", label: "Scrivici" }}
        secondary={{ href: "/richiesta-preventivo", label: "Richiedi un preventivo" }}
      />
    </>
  );
}
