import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { OrganizationJsonLd } from "@/components/content/json-ld";
import { site } from "@/config/site";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {site.reviewMode ? (
        <div className="bg-brass-100 px-4 py-2 text-center text-[0.8125rem] text-navy-900">
          <strong className="font-semibold">Versione di presentazione.</strong> Dati aziendali e testi informativi
          sono in revisione: gli elementi segnati non vanno pubblicati senza verifica.
        </div>
      ) : null}
      <SiteHeader />
      <main id="contenuto" tabIndex={-1} className="flex-1 focus:outline-none">
        {children}
      </main>
      <SiteFooter />
      <OrganizationJsonLd />
    </>
  );
}
