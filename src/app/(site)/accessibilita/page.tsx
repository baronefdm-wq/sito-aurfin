import { LegalPageView, legalMetadata } from "@/components/content/legal-page";

export const metadata = legalMetadata("accessibilita");

export default function Page() {
  return <LegalPageView slug="accessibilita" />;
}