import type { Metadata, Viewport } from "next";
import { Inter, Montserrat, Source_Serif_4 } from "next/font/google";
import { site } from "@/config/site";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  variable: "--font-source-serif",
  weight: ["400", "500", "600"],
  display: "swap",
});
const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
  weight: ["600"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: "AURFIN — Cessione del quinto, prestiti per delega e prestiti personali",
    template: "%s · AURFIN",
  },
  description: site.description,
  applicationName: "AURFIN",
  openGraph: {
    type: "website",
    locale: "it_IT",
    siteName: "AURFIN",
  },
  formatDetection: { telephone: false, email: false, address: false },
};

export const viewport: Viewport = {
  themeColor: "#142D40",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="it"
      className={`${inter.variable} ${sourceSerif.variable} ${montserrat.variable} antialiased`}
    >
      <body className="flex min-h-dvh flex-col">
        <a
          href="#contenuto"
          className="sr-only z-[100] rounded-md bg-navy-900 px-4 py-3 text-ivory focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
        >
          Vai al contenuto principale
        </a>
        {children}
      </body>
    </html>
  );
}
