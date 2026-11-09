import type { Metadata } from "next";

/** Radice dello spazio team: titoli e indicizzazione separati dal sito dei clienti. */
export const metadata: Metadata = {
  title: { default: "AURFIN Team", template: "%s · AURFIN Team" },
  robots: { index: false, follow: false },
};

export default function TeamRootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
