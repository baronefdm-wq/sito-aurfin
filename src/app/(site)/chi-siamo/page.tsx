import type { Metadata } from "next";
import Link from "next/link";
import { CtaBand, PageHeader } from "@/components/content/blocks";
import { ConfigValue, Placeholder, ReviewNote } from "@/components/content/review";
import { Container, Section, SectionHeading } from "@/components/ui/primitives";
import { site } from "@/config/site";

export const metadata: Metadata = {
  title: "Chi siamo",
  description:
    "AURFIN è un agente in attività finanziaria: accompagna le persone nella richiesta di cessione del quinto, prestito per delega e prestito personale.",
  alternates: { canonical: "/chi-siamo" },
};

const method = [
  { title: "Ascoltare prima di proporre", text: "Partiamo dalla tua esigenza e dal tuo bilancio familiare, non da un prodotto da vendere." },
  { title: "Spiegare in modo semplice", text: "Ogni termine tecnico viene chiarito: TAN, TAEG, quota cedibile, coperture assicurative." },
  { title: "Chiedere solo ciò che serve", text: "I documenti servono solo se decidi di proseguire." },
  { title: "Tenerti aggiornato", text: "Ti diciamo a che punto è la richiesta e cosa succede dopo, anche quando la risposta non è quella sperata." },
];

const values = [
  { title: "Chiarezza", text: "Informazioni complete e comprensibili, senza promesse che non dipendono da noi." },
  { title: "Rispetto", text: "Dei tuoi tempi, delle tue scelte e dei tuoi dati personali." },
  { title: "Responsabilità", text: "Un finanziamento è un impegno lungo: ti aiutiamo a valutarne la sostenibilità." },
];

export default function AboutPage() {
  const { company, registration, team } = site;
  return (
    <>
      <PageHeader
        eyebrow="Chi siamo"
        title="Ti accompagniamo nella scelta, con chiarezza e misura"
        lead="AURFIN opera come agente in attività finanziaria: promuove i finanziamenti degli intermediari con cui ha un mandato, ti aiuta a capirli e segue la richiesta fino alla risposta del finanziatore."
        crumbs={[{ href: "/chi-siamo", label: "Chi siamo" }]}
      />

      <Section aria-labelledby="ruolo-titolo">
        <Container className="grid gap-12 lg:grid-cols-[1fr_1.4fr] lg:gap-20">
          <SectionHeading id="ruolo-titolo" eyebrow="Il nostro ruolo" title="Cosa fa un agente in attività finanziaria" />
          <div className="prose-aurfin">
            <p>
              L&apos;agente in attività finanziaria è un soggetto iscritto in un elenco pubblico tenuto dall&apos;OAM
              (Organismo degli Agenti e dei Mediatori) che opera su mandato di uno o più intermediari, come banche o
              società finanziarie, per promuoverne e, se previsto, concluderne i contratti di finanziamento.
            </p>
            <p>
              Concretamente, AURFIN ti ascolta, ti illustra le soluzioni dei finanziatori mandanti, raccoglie la
              documentazione e la trasmette. <strong>La valutazione della richiesta e la decisione di concedere il
              finanziamento spettano sempre al finanziatore</strong>, che fissa anche tassi e condizioni.
            </p>
            <p>
              Prima di qualsiasi impegno ricevi l&apos;indicazione degli intermediari per cui operiamo e la
              documentazione di trasparenza prevista.
            </p>
            <ReviewNote>
              Descrizione del ruolo da validare con la compliance, in base al mandato effettivo (monomandatario o
              plurimandatario) e ai prodotti intermediati.
            </ReviewNote>
          </div>
        </Container>
      </Section>

      <Section tone="ivory" aria-labelledby="metodo-titolo">
        <Container>
          <SectionHeading id="metodo-titolo" eyebrow="Metodo" title="Come lavoriamo" />
          <ol className="mt-12 grid gap-x-10 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
            {method.map((m, i) => (
              <li key={m.title} className="border-t border-navy-900 pt-5">
                <span className="font-serif text-lg text-brass-700 tabular-nums">0{i + 1}</span>
                <h3 className="mt-3 text-lg font-semibold text-navy-900">{m.title}</h3>
                <p className="mt-2 leading-relaxed text-slate">{m.text}</p>
              </li>
            ))}
          </ol>
        </Container>
      </Section>

      <Section aria-labelledby="valori-titolo">
        <Container className="grid gap-12 lg:grid-cols-[1fr_1.4fr] lg:gap-20">
          <SectionHeading id="valori-titolo" eyebrow="Valori" title="Ciò che guida il nostro lavoro" />
          <dl className="divide-y divide-line border-y border-line">
            {values.map((v) => (
              <div key={v.title} className="grid gap-2 py-6 sm:grid-cols-[10rem_1fr]">
                <dt className="font-serif text-xl text-navy-900">{v.title}</dt>
                <dd className="leading-relaxed text-slate">{v.text}</dd>
              </div>
            ))}
          </dl>
        </Container>
      </Section>

      {team.length > 0 ? (
        <Section tone="ivory" aria-labelledby="team-titolo">
          <Container>
            <SectionHeading id="team-titolo" eyebrow="Persone" title="Il team" />
            <ul className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {team.map((m) => (
                <li key={m.name} className="border-t border-line-strong pt-5">
                  <p className="font-serif text-xl text-navy-900">{m.name}</p>
                  <p className="text-sm text-slate">{m.role}</p>
                  {m.bio ? <p className="mt-3 leading-relaxed text-slate">{m.bio}</p> : null}
                </li>
              ))}
            </ul>
          </Container>
        </Section>
      ) : null}

      <Section tone={team.length > 0 ? "paper" : "ivory"} aria-labelledby="societa-titolo">
        <Container className="grid gap-12 lg:grid-cols-[1fr_1.4fr] lg:gap-20">
          <div>
            <SectionHeading id="societa-titolo" eyebrow="Identità societaria" title="Dati della società e iscrizioni" />
            <p className="mt-5 leading-relaxed text-slate">
              Puoi verificare l&apos;iscrizione degli agenti e dei mediatori negli elenchi pubblici sul{" "}
              <a href={site.links.oamRegistry} target="_blank" rel="noopener noreferrer" className="text-teal-700 underline underline-offset-2">
                sito dell&apos;OAM<span className="sr-only"> (sito esterno, nuova scheda)</span>
              </a>
              .
            </p>
          </div>
          <div>
            <dl className="divide-y divide-line rounded-lg border border-line bg-white">
              {[
                ["Ragione sociale", <ConfigValue key="n" value={company.legalName} label="Ragione sociale" />],
                ["Forma giuridica", <ConfigValue key="f" value={company.legalForm} label="Forma giuridica" />],
                ["Sede legale", <ConfigValue key="s" value={company.registeredOffice} label="Sede legale" />],
                ["Codice fiscale e Partita IVA", <ConfigValue key="p" value={company.vatNumber} label="Partita IVA" />],
                ["REA", <ConfigValue key="r" value={company.rea} label="Numero REA" />],
                [
                  "Attività",
                  registration.role === "agente-attivita-finanziaria" ? (
                    "Agente in attività finanziaria (Titolo VI-bis, D.Lgs. 385/1993)"
                  ) : (
                    <Placeholder key="a">Ruolo dell&apos;intermediario da inserire</Placeholder>
                  ),
                ],
                [
                  "Iscrizione OAM",
                  registration.number ? (
                    `${registration.register ?? "Elenco OAM"}, n. ${registration.number} dal ${registration.registeredAt}`
                  ) : (
                    <Placeholder key="o">Numero e data di iscrizione OAM da inserire</Placeholder>
                  ),
                ],
                [
                  "Intermediari mandanti",
                  registration.principals.length ? (
                    registration.principals.join(", ")
                  ) : (
                    <Placeholder key="m">Elenco dei mandanti da inserire</Placeholder>
                  ),
                ],
              ].map(([label, value]) => (
                <div key={label as string} className="grid gap-1 px-5 py-4 sm:grid-cols-[13rem_1fr] sm:gap-6">
                  <dt className="text-sm text-slate">{label}</dt>
                  <dd className="text-navy-900">{value}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-4 text-sm text-slate">
              Altre informazioni nella pagina{" "}
              <Link href="/informazioni-societarie" className="text-teal-700 underline underline-offset-2">
                Informazioni societarie
              </Link>
              .
            </p>
          </div>
        </Container>
      </Section>

      <CtaBand
        title="Vuoi conoscerci meglio?"
        text="Il modo più semplice è chiederci un preventivo: ti rispondiamo via email, senza impegno e senza documenti da preparare."
        primary={{ href: "/richiesta-preventivo", label: "Richiedi un preventivo" }}
        secondary={{ href: "/come-funziona", label: "Come funziona" }}
      />
    </>
  );
}
