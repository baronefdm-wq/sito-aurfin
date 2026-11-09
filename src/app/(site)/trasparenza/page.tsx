import { LegalPageView, legalMetadata } from "@/components/content/legal-page";

export const metadata = legalMetadata("trasparenza");

export default function Page() {
  return <LegalPageView slug="trasparenza" />;
}