import type { Metadata } from "next";
import { CtaBand, PageHeader, StepList } from "@/components/content/blocks";
import { ReviewNote } from "@/components/content/review";
import { Container, Section, SectionHeading } from "@/components/ui/primitives";

export const metadata: Metadata = {
  title: "Come funziona",
  description:
    "Il percorso di una richiesta con AURFIN: dalla richiesta al preventivo via email, dalla documentazione alla valutazione del finanziatore e agli aggiornamenti.",
  alternates: { canonical: "/come-funziona" },
};

const phases = [
  {
    title: "Prima richiesta",
    text: "Compili un breve modulo. Ci servono i dati per risponderti e un'idea della tua esigenza; puoi allegare subito i documenti.",
  },
  {
    title: "Preventivo via email",
    text: "Entro un giorno lavorativo ti rispondiamo con il preventivo. Se hai dubbi, nell'email trovi il link per prenotare una telefonata; altrimenti proseguiamo via email.",
  },
  {
    title: "Scelta del percorso",
    text: "Ti spieghiamo quali soluzioni possono essere valutate e quali no, e perché. Puoi anche decidere di non procedere.",
  },
  {
    title: "Raccolta della documentazione",
    text: "Verifichiamo i documenti che hai già allegato e ti indichiamo quelli mancanti, da caricare nell'area riservata. Così evitiamo ritardi.",
  },
  {
    title: "Valutazione del finanziatore",
    text: "La richiesta viene presentata al finanziatore, che svolge le proprie verifiche, comprese quelle sul merito creditizio.",
  },
  {
    title: "Esito ed eventuale proposta",
    text: "Se l'esito è positivo ricevi la proposta con le informazioni precontrattuali. Ti aiutiamo a leggerla prima della firma.",
  },
  {
    title: "Aggiornamenti",
    text: "Nell'area riservata vedi lo stato della richiesta, i documenti e gli appuntamenti; il consulente ti avvisa nei passaggi chiave.",
  },
];

const roles = [
  {
    who: "Tu",
    does: ["Racconti la tua esigenza", "Fornisci i documenti richiesti", "Leggi la proposta e decidi se firmarla"],
  },
  {
    who: "AURFIN",
    does: [
      "Ti spiega le soluzioni e i loro costi",
      "Raccoglie e controlla la documentazione",
      "Presenta la richiesta e ti tiene aggiornato",
    ],
  },
  {
    who: "Il finanziatore",
    does: [
      "Valuta la richiesta e il merito creditizio",
      "Decide se concedere il finanziamento",
      "Stabilisce tassi e condizioni ed eroga la somma",
    ],
  },
  {
    who: "Datore di lavoro o ente pensionistico",
    does: [
      "Rilascia il certificato di stipendio o la quota cedibile",
      "Applica la trattenuta mensile, per cessione e delega",
    ],
  },
];

export default function HowItWorksPage() {
  return (
    <>
      <PageHeader
        eyebrow="Come funziona"
        title="Dalla prima richiesta alla risposta, passo dopo passo"
        lead="Un percorso chiaro, in cui sai sempre cosa succede, chi decide e cosa ti serve. Puoi fermarti in qualsiasi momento."
        crumbs={[{ href: "/come-funziona", label: "Come funziona" }]}
      />

      <Section aria-labelledby="fasi-titolo">
        <Container className="grid gap-12 lg:grid-cols-[1fr_1.4fr] lg:gap-20">
          <div className="lg:sticky lg:top-28 lg:self-start">
            <SectionHeading
              id="fasi-titolo"
              eyebrow="Il percorso"
              title="Sette momenti"
              intro="I tempi dipendono soprattutto dal rilascio dei documenti e dalle verifiche del finanziatore: per questo non indichiamo durate certe."
            />
          </div>
          <StepList steps={phases} />
        </Container>
      </Section>

      <Section tone="ivory" aria-labelledby="ruoli-titolo">
        <Container>
          <SectionHeading
            id="ruoli-titolo"
            eyebrow="Chi fa cosa"
            title="Ruoli diversi, responsabilità chiare"
            intro="AURFIN non concede finanziamenti: ti accompagna nella richiesta. La decisione è sempre del finanziatore."
          />
          <div className="mt-12 grid gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
            {roles.map((r) => (
              <div key={r.who} className="bg-paper p-6">
                <h3 className="font-serif text-xl text-navy-900">{r.who}</h3>
                <ul className="mt-4 space-y-2.5">
                  {r.does.map((d) => (
                    <li key={d} className="flex gap-2.5 leading-snug text-slate">
                      <span aria-hidden className="mt-2.5 h-px w-3 shrink-0 bg-brass" />
                      {d}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <ReviewNote className="mt-8">
            Ripartizione dei ruoli da confermare in base al mandato effettivo con i finanziatori.
          </ReviewNote>
        </Container>
      </Section>

      <CtaBand
        title="Il primo passo è una richiesta senza impegno"
        text="Pochi dati e, se vuoi, i documenti già allegati. Ti rispondiamo via email entro un giorno lavorativo."
        primary={{ href: "/richiesta-preventivo", label: "Richiedi un preventivo" }}
      />
    </>
  );
}
