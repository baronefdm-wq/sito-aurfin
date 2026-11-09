import { LegalPageView, legalMetadata } from "@/components/content/legal-page";

export const metadata = legalMetadata("cookie");

export default function Page() {
  return <LegalPageView slug="cookie" />;
}