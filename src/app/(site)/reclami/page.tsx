import { LegalPageView, legalMetadata } from "@/components/content/legal-page";

export const metadata = legalMetadata("reclami");

export default function Page() {
  return <LegalPageView slug="reclami" />;
}