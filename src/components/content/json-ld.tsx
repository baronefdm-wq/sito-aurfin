import { hasCompanyIdentity, site } from "@/config/site";

/**
 * Dati strutturati Organization: emessi solo quando l'identità societaria
 * è stata compilata nella configurazione. Nessun dato inventato.
 */
export function OrganizationJsonLd() {
  if (!hasCompanyIdentity()) return null;
  const { company, contacts } = site;
  const data = {
    "@context": "https://schema.org",
    "@type": "FinancialService",
    name: "AURFIN",
    legalName: company.legalName,
    vatID: company.vatNumber,
    url: site.url,
    ...(contacts.phone ? { telephone: contacts.phone } : {}),
    ...(contacts.email ? { email: contacts.email } : {}),
    address: contacts.address ?? company.registeredOffice,
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
