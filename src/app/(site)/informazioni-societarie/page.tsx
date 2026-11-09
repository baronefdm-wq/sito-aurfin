import { LegalPageView, legalMetadata } from "@/components/content/legal-page";

export const metadata = legalMetadata("informazioni-societarie");

export default function Page() {
  return <LegalPageView slug="informazioni-societarie" />;
}