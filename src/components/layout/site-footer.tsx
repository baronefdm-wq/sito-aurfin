import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { Placeholder } from "@/components/content/review";
import { Container } from "@/components/ui/primitives";
import { legalNav, mainNav, solutions } from "@/config/navigation";
import { site } from "@/config/site";

function FooterList({ title, items }: { title: string; items: { href: string; label: string }[] }) {
  return (
    <div>
      <h2 className="text-xs font-semibold tracking-[0.14em] text-brass uppercase">{title}</h2>
      <ul className="mt-4 space-y-1">
        {items.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className="inline-flex min-h-9 items-center text-[0.9375rem] text-ivory/80 transition-colors hover:text-white"
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function SiteFooter() {
  const { company, registration, contacts } = site;
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto bg-navy-950 text-ivory">
      <Container className="py-16">
        <div className="grid gap-12 lg:grid-cols-[1.3fr_2fr]">
          <div className="max-w-sm">
            <Logo inverse />
            <p className="mt-5 leading-relaxed text-ivory/75">
              Ti aiutiamo a capire le soluzioni di finanziamento e seguiamo la tua richiesta. La valutazione e
              l&apos;eventuale concessione del credito spettano al soggetto finanziatore.
            </p>
            <dl className="mt-6 space-y-2 text-[0.9375rem] text-ivory/80">
              {contacts.email ? (
                <div>
                  <dt className="sr-only">Email</dt>
                  <dd>
                    <a href={`mailto:${contacts.email}`} className="hover:text-white">
                      {contacts.email}
                    </a>
                  </dd>
                </div>
              ) : (
                <Placeholder className="border-brass/60 bg-transparent text-brass">Email da inserire</Placeholder>
              )}
            </dl>
          </div>
          <div className="grid grid-cols-2 gap-10 sm:grid-cols-3">
            <FooterList title="Soluzioni" items={solutions} />
            <FooterList
              title="AURFIN"
              items={[...mainNav, { href: "/richiesta-preventivo", label: "Richiedi un preventivo" }]}
            />
            <FooterList title="Informazioni" items={legalNav} />
          </div>
        </div>

        <div className="mt-14 border-t border-ivory/15 pt-8 text-sm leading-relaxed text-ivory/65">
          <p>
            {company.legalName ? (
              <>
                {company.legalName}
                {company.registeredOffice ? ` · Sede legale: ${company.registeredOffice}` : null}
                {company.vatNumber ? ` · C.F. e P. IVA ${company.vatNumber}` : null}
                {company.rea ? ` · REA ${company.rea}` : null}
                {company.shareCapital ? ` · Capitale sociale ${company.shareCapital}` : null}
                {company.pec ? ` · PEC ${company.pec}` : null}
              </>
            ) : (
              <Placeholder className="border-brass/60 bg-transparent text-brass">
                Ragione sociale, P. IVA e sede legale da inserire
              </Placeholder>
            )}
          </p>
          <p className="mt-2">
            {registration.number && registration.register ? (
              <>
                Agente in attività finanziaria iscritto all&apos;{registration.register} dell&apos;OAM, n.{" "}
                {registration.number} dal {registration.registeredAt}. Verificabile sul sito{" "}
                <a href={site.links.oamRegistry} className="underline underline-offset-2 hover:text-white" rel="noopener">
                  dell&apos;OAM
                </a>
                .
                {registration.principals.length ? (
                  ` Intermediari mandanti: ${registration.principals.join(", ")}.`
                ) : (
                  <>
                    {" "}
                    <Placeholder className="border-brass/60 bg-transparent text-brass">
                      Intermediari mandanti da inserire
                    </Placeholder>
                  </>
                )}
              </>
            ) : (
              <>
                {registration.role === "agente-attivita-finanziaria" ? "Agente in attività finanziaria. " : null}
                <Placeholder className="border-brass/60 bg-transparent text-brass">
                  Numero di iscrizione all&apos;Elenco OAM e intermediari mandanti da inserire
                </Placeholder>
              </>
            )}
          </p>
          <p className="mt-6 max-w-4xl text-ivory/55">
            Messaggio pubblicitario con finalità promozionale. Le informazioni presenti nel sito hanno carattere
            generale e non costituiscono offerta. Per le condizioni contrattuali ed economiche fare riferimento alla
            documentazione informativa messa a disposizione dal soggetto finanziatore.
          </p>
          <p className="mt-6">© {year} AURFIN</p>
        </div>
      </Container>
    </footer>
  );
}
