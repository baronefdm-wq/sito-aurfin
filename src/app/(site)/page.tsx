import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { CtaBand, DiagonalMotif, FaqList, StepList } from "@/components/content/blocks";
import { ReviewNote } from "@/components/content/review";
import { RequestConfigurator } from "@/components/simulator/request-configurator";
import { Button } from "@/components/ui/button";
import { Container, Eyebrow, Section, SectionHeading } from "@/components/ui/primitives";
import { solutions } from "@/config/navigation";
import { generalFaqs } from "@/content/faq";

export const metadata: Metadata = {
  title: { absolute: "AURFIN — Cessione del quinto, prestiti per delega e prestiti personali" },
  description:
    "AURFIN ti accompagna nella scelta di una soluzione di finanziamento: cessione del quinto, prestito per delega e prestiti personali, con un consulente che ti segue passo dopo passo.",
  alternates: { canonical: "/" },
};

const journey = [
  { title: "Richiesta", text: "Ci lasci i dati essenziali e, se vuoi, alleghi già i documenti." },
  { title: "Confronto con un consulente", text: "Analizziamo insieme esigenza, opzioni e sostenibilità." },
  { title: "Valutazione della documentazione", text: "Se decidi di procedere, prepariamo una richiesta completa." },
  { title: "Eventuale proposta", text: "Il finanziatore decide; tu valuti la proposta con calma." },
];

const profiles = [
  {
    title: "Dipendenti pubblici",
    text: "Chi lavora per enti e amministrazioni pubbliche valuta spesso la cessione del quinto o il prestito per delega.",
    topics: ["Cessione del quinto dello stipendio", "Prestito per delega, se l'ente lo prevede", "Prestito personale"],
    check: "Tipo di rapporto di lavoro e trattenute già presenti.",
  },
  {
    title: "Dipendenti privati",
    text: "Per chi lavora in azienda contano il contratto, l'anzianità e le caratteristiche del datore di lavoro.",
    topics: ["Cessione del quinto dello stipendio", "Prestito per delega, se l'azienda accetta", "Prestito personale"],
    check: "Contratto, anzianità, TFR maturato e disponibilità dell'azienda.",
  },
  {
    title: "Pensionati",
    text: "Chi riceve una pensione può valutare soluzioni con rimborso direttamente sul cedolino.",
    topics: ["Cessione del quinto della pensione", "Prestito personale"],
    check: "Importo della pensione, ente erogatore ed età alla fine del piano.",
  },
];

const principles = [
  {
    title: "Un unico interlocutore",
    text: "Un consulente segue la tua richiesta dall'inizio alla fine e sai sempre a chi rivolgerti.",
  },
  {
    title: "Spiegazioni prima delle firme",
    text: "Ti spieghiamo ogni passaggio e i documenti che ricevi, compreso il significato di TAN e TAEG.",
  },
  {
    title: "Documenti al sicuro",
    text: "Ti indichiamo solo i documenti necessari. Puoi caricarli subito o più tardi: sono conservati in un archivio privato e consultati solo dal personale autorizzato.",
  },
  {
    title: "Avanzamento visibile",
    text: "Nell'area riservata vedi a che punto è la richiesta, quali documenti mancano e i prossimi appuntamenti.",
  },
];

export default function HomePage() {
  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden border-b border-line bg-ivory" aria-labelledby="hero-titolo">
        <DiagonalMotif className="pointer-events-none absolute top-10 -right-40 hidden h-[34rem] text-navy-900/[0.035] lg:block" />
        <Container className="relative grid gap-14 py-14 sm:py-20 lg:grid-cols-[1.25fr_1fr] lg:items-center lg:py-28">
          <div className="animate-fade-up">
            <Eyebrow>Cessione del quinto · Delega · Prestiti personali</Eyebrow>
            <h1
              id="hero-titolo"
              className="mt-6 font-serif text-[2.5rem] leading-[1.06] tracking-[-0.025em] text-balance text-navy-900 sm:text-6xl lg:text-[3.5rem] xl:text-[4.25rem]"
            >
              Un finanziamento si sceglie meglio quando è spiegato con chiarezza.
            </h1>
            <p className="mt-7 max-w-xl text-lg leading-relaxed text-pretty text-slate sm:text-xl">
              AURFIN ascolta la tua esigenza, ti aiuta a capire le soluzioni possibili e segue la richiesta con te.
              La valutazione e la decisione finale spettano sempre al soggetto finanziatore.
            </p>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link href="/richiesta-preventivo">
                  Richiedi un preventivo
                  <ArrowRight aria-hidden />
                </Link>
              </Button>
              <Button asChild size="lg" variant="secondary">
                <Link href="#soluzioni">Scopri le soluzioni</Link>
              </Button>
            </div>
          </div>

          <figure
            className="animate-fade-up rounded-lg border border-line bg-white p-6 shadow-lift [animation-delay:120ms] sm:p-8"
            aria-labelledby="hero-percorso"
          >
            <figcaption id="hero-percorso" className="flex items-center justify-between gap-4">
              <span className="text-xs font-semibold tracking-[0.14em] text-brass-700 uppercase">Il percorso</span>
              <span className="text-sm text-slate">4 passaggi</span>
            </figcaption>
            <ol className="mt-6 space-y-0">
              {journey.map((step, i) => (
                <li key={step.title} className="relative flex gap-4 pb-6 last:pb-0">
                  {i < journey.length - 1 ? (
                    <span aria-hidden className="absolute top-8 bottom-0 left-[0.9375rem] w-px bg-brass/50" />
                  ) : null}
                  <span className="relative flex size-[1.875rem] shrink-0 items-center justify-center rounded-full bg-navy-900 text-sm font-semibold text-ivory tabular-nums">
                    {i + 1}
                  </span>
                  <div>
                    <p className="font-semibold text-navy-900">{step.title}</p>
                    <p className="mt-0.5 text-[0.9375rem] leading-relaxed text-slate">{step.text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </figure>
        </Container>
      </section>

      {/* SOLUZIONI */}
      <Section id="soluzioni" aria-labelledby="soluzioni-titolo">
        <Container>
          <SectionHeading
            id="soluzioni-titolo"
            eyebrow="Le soluzioni"
            title="Tre strade diverse, da valutare con attenzione"
            intro="Ogni soluzione ha un funzionamento e requisiti propri. Ti spieghiamo le differenze, così puoi capire quale approfondire."
          />
          <ul className="mt-14 grid gap-px overflow-hidden rounded-lg border border-line bg-line md:grid-cols-3">
            {solutions.map((s, i) => (
              <li key={s.href} className="group relative bg-paper transition-colors hover:bg-white">
                <Link href={s.href} className="flex h-full flex-col p-7 sm:p-8">
                  <span className="font-serif text-lg text-brass-700 tabular-nums">0{i + 1}</span>
                  <h3 className="mt-8 font-serif text-2xl text-navy-900">{s.label}</h3>
                  <p className="mt-3 flex-1 leading-relaxed text-slate">{s.description}</p>
                  <span className="mt-8 inline-flex items-center gap-2 text-[0.9375rem] font-medium text-teal-700">
                    Come funziona
                    <ArrowUpRight
                      aria-hidden
                      className="size-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                    />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Container>
      </Section>

      {/* PERCORSI PER PROFILO */}
      <Section tone="ivory" aria-labelledby="profili-titolo">
        <Container>
          <SectionHeading
            id="profili-titolo"
            eyebrow="Per la tua situazione"
            title="Da dove partire, in base al tuo lavoro"
            intro="Sono indicazioni di massima: l'accesso a ciascuna soluzione dipende dalla valutazione del finanziatore e, in alcuni casi, dal datore di lavoro."
          />
          <div className="mt-14 grid gap-10 md:grid-cols-3 md:gap-8">
            {profiles.map((p) => (
              <article key={p.title} className="border-t-2 border-navy-900 pt-6">
                <h3 className="font-serif text-2xl text-navy-900">{p.title}</h3>
                <p className="mt-3 leading-relaxed text-slate">{p.text}</p>
                <p className="mt-6 text-sm font-semibold text-navy-900">Soluzioni da approfondire</p>
                <ul className="mt-2 space-y-1.5">
                  {p.topics.map((t) => (
                    <li key={t} className="flex gap-2.5 text-[0.9375rem] text-navy-900">
                      <span aria-hidden className="mt-2.5 h-px w-3 shrink-0 bg-brass" />
                      {t}
                    </li>
                  ))}
                </ul>
                <p className="mt-6 text-sm leading-relaxed text-slate">
                  <span className="font-semibold text-navy-900">Cosa si verifica: </span>
                  {p.check}
                </p>
              </article>
            ))}
          </div>
        </Container>
      </Section>

      {/* COME FUNZIONA */}
      <Section aria-labelledby="come-titolo">
        <Container className="grid gap-12 lg:grid-cols-[1fr_1.2fr] lg:gap-20">
          <div>
            <SectionHeading
              id="come-titolo"
              eyebrow="Come funziona"
              title="Quattro passaggi, senza sorprese"
              intro="Puoi fermarti in qualsiasi momento. Ti diciamo con chiarezza cosa succede a ogni passaggio e chi prende le decisioni."
            />
            <Button asChild variant="secondary" className="mt-8">
              <Link href="/come-funziona">Il percorso nel dettaglio</Link>
            </Button>
          </div>
          <StepList
            steps={[
              { title: "La tua richiesta", text: "Indichi la soluzione di interesse, la tua situazione lavorativa, importo e durata indicativi. Se vuoi, alleghi già i documenti." },
              { title: "Il preventivo via email", text: "Entro un giorno lavorativo ti rispondiamo con il preventivo. Se hai dubbi, nell'email trovi il link per prenotare una telefonata; altrimenti proseguiamo via email." },
              { title: "La valutazione della documentazione", text: "Se vuoi proseguire, ti indichiamo i documenti necessari e li verifichiamo con te prima di presentare la richiesta." },
              { title: "L'eventuale proposta", text: "Il finanziatore svolge le sue verifiche. In caso di esito positivo ricevi la proposta con tutta la documentazione informativa." },
            ]}
          />
        </Container>
      </Section>

      {/* PRINCIPI DEL SERVIZIO */}
      <Section tone="navy" aria-labelledby="principi-titolo" className="relative overflow-hidden">
        <Container>
          <div className="max-w-3xl">
            <p className="flex items-center gap-3 text-[0.8125rem] font-semibold tracking-[0.14em] text-brass uppercase before:h-px before:w-6 before:bg-brass">
              Il servizio
            </p>
            <h2 id="principi-titolo" className="mt-4 font-serif text-[1.875rem] leading-tight text-balance sm:text-[2.375rem]">
              Cosa puoi aspettarti da noi
            </h2>
          </div>
          <ul className="mt-14 grid gap-x-12 gap-y-10 sm:grid-cols-2">
            {principles.map((p) => (
              <li key={p.title} className="border-t border-ivory/20 pt-6">
                <h3 className="text-lg font-semibold text-ivory">{p.title}</h3>
                <p className="mt-2 leading-relaxed text-ivory/75">{p.text}</p>
              </li>
            ))}
          </ul>
          <ReviewNote className="mt-12 border-brass/60 bg-white/5 text-ivory">
            Impegni di servizio da confermare con AURFIN prima della pubblicazione.
          </ReviewNote>
        </Container>
      </Section>

      {/* CONFIGURATORE */}
      <Section aria-labelledby="config-titolo">
        <Container>
          <SectionHeading
            id="config-titolo"
            eyebrow="Configuratore"
            title="Dacci un'idea di ciò che ti serve"
            intro="Scegli tipologia, importo e durata. Non calcoliamo rate né costi: ti serve solo per preparare la richiesta da approfondire con un consulente."
          />
          <RequestConfigurator className="mt-12" headingLevel="h3" />
        </Container>
      </Section>

      {/* FAQ */}
      <Section tone="ivory" aria-labelledby="faq-titolo">
        <Container className="grid gap-10 lg:grid-cols-[1fr_1.6fr] lg:gap-16">
          <div>
            <SectionHeading id="faq-titolo" eyebrow="Domande frequenti" title="Le risposte alle domande più comuni" />
            <Link href="/faq" className="mt-6 inline-flex items-center gap-2 font-medium text-teal-700 hover:underline">
              Tutte le domande frequenti <ArrowRight aria-hidden className="size-4" />
            </Link>
          </div>
          <FaqList items={generalFaqs} />
        </Container>
      </Section>

      <CtaBand
        title="Il primo passo è una richiesta senza impegno"
        text="Ti rispondiamo via email con il preventivo entro un giorno lavorativo."
        primary={{ href: "/richiesta-preventivo", label: "Richiedi un preventivo" }}
        secondary={{ href: "/contatti", label: "Contatti" }}
      />
    </>
  );
}
