import { LegalPageView, legalMetadata } from "@/components/content/legal-page";

export const metadata = legalMetadata("informativa-intermediario");

export default function Page() {
  return <LegalPageView slug="informativa-intermediario" />;
}