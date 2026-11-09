import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { DiagonalMotif } from "@/components/content/blocks";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/primitives";

export const metadata = { title: "Pagina non trovata" };

export default function NotFound() {
  return (
    <main id="contenuto" className="relative flex flex-1 items-center overflow-hidden bg-ivory">
      <DiagonalMotif className="pointer-events-none absolute -right-20 bottom-0 h-96 text-navy-900/[0.04]" />
      <Container className="relative py-20">
        <Link href="/" aria-label="AURFIN, torna alla home">
          <Logo />
        </Link>
        <p className="mt-16 font-serif text-lg text-brass-700">Errore 404</p>
        <h1 className="mt-3 max-w-2xl font-serif text-4xl leading-tight text-navy-900 sm:text-5xl">
          Questa pagina non esiste o è stata spostata.
        </h1>
        <p className="mt-5 max-w-xl text-lg text-slate">
          Controlla l&apos;indirizzo oppure riparti da una delle sezioni principali.
        </p>
        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <Button asChild size="lg">
            <Link href="/">Torna alla home</Link>
          </Button>
          <Button asChild size="lg" variant="secondary">
            <Link href="/contatti">Contatti</Link>
          </Button>
        </div>
      </Container>
    </main>
  );
}
