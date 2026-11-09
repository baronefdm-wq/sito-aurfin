import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { Breadcrumbs } from "@/components/content/blocks";
import { QuoteWizard } from "@/components/forms/quote-wizard";
import { Container, Eyebrow } from "@/components/ui/primitives";
import { isStorageConfigured } from "@/lib/server/storage";

export const metadata: Metadata = {
  title: "Richiedi un preventivo",
  description:
    "Richiedi un preventivo per cessione del quinto, prestito per delega o prestito personale: pochi dati, documenti allegabili subito o in seguito, nessun impegno.",
  alternates: { canonical: "/richiesta-preventivo" },
};

export default async function QuotePage() {
  // Rendering a ogni richiesta: lo storage dei documenti dipende dalla configurazione di avvio, non dalla build.
  await connection();
  return (
    <div className="bg-ivory">
      <Container className="py-10 sm:py-14">
        <Breadcrumbs items={[{ href: "/richiesta-preventivo", label: "Richiesta di preventivo" }]} />
        <div className="mt-8 max-w-3xl">
          <Eyebrow>Richiesta di preventivo</Eyebrow>
          <h1 className="mt-4 font-serif text-4xl leading-tight tracking-[-0.015em] text-navy-900 sm:text-5xl">
            Sei passaggi, pochi minuti
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-slate">
            Indica la tua esigenza e, se li hai a portata di mano, allega i documenti: il consulente potrà valutare la
            tua situazione più rapidamente. Non ti chiediamo coordinate bancarie.
          </p>
        </div>
        <div className="mt-10">
          <Suspense fallback={<p className="text-slate">Caricamento del modulo…</p>}>
            <QuoteWizard uploadsEnabled={isStorageConfigured()} />
          </Suspense>
        </div>
      </Container>
    </div>
  );
}
