import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Mail } from "lucide-react";
import { PageHeader } from "@/components/content/blocks";
import { Placeholder } from "@/components/content/review";
import { Button } from "@/components/ui/button";
import { Container, Section } from "@/components/ui/primitives";
import { site } from "@/config/site";

export const metadata: Metadata = {
  title: "Contatti",
  description: "Per informazioni scrivi ad AURFIN via email. Per un preventivo compila la richiesta online.",
  alternates: { canonical: "/contatti" },
};

export default function ContactPage() {
  const { email } = site.contacts;
  return (
    <>
      <PageHeader
        eyebrow="Contatti"
        title="Per informazioni, scrivici"
        lead="Rispondiamo a ogni messaggio via email, anche se riguarda solo una curiosità."
        crumbs={[{ href: "/contatti", label: "Contatti" }]}
      />
      <Section>
        <Container className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-lg border border-line bg-white p-6 sm:p-8">
            <Mail aria-hidden className="size-6 text-teal-700" strokeWidth={1.5} />
            <h2 className="mt-4 font-serif text-2xl text-navy-900">Email</h2>
            <p className="mt-2 text-lg text-navy-900">
              {email ? (
                <a href={`mailto:${email}`} className="font-medium underline-offset-2 hover:text-teal-700 hover:underline">
                  {email}
                </a>
              ) : (
                <Placeholder>Email per il pubblico da inserire</Placeholder>
              )}
            </p>
          </div>
          <div className="rounded-lg bg-navy-900 p-6 text-ivory sm:p-8">
            <h2 className="font-serif text-2xl">Vuoi un preventivo?</h2>
            <p className="mt-2 leading-relaxed text-ivory/80">{site.firstResponsePromise}</p>
            <Button asChild variant="inverse" className="mt-5">
              <Link href="/richiesta-preventivo">
                Richiedi un preventivo
                <ArrowRight aria-hidden />
              </Link>
            </Button>
          </div>
        </Container>
      </Section>
    </>
  );
}
