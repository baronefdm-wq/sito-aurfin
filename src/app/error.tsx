"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/primitives";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main id="contenuto" className="flex flex-1 items-center bg-ivory">
      <Container className="py-20">
        <p className="font-serif text-lg text-brass-700">Si è verificato un problema</p>
        <h1 className="mt-3 max-w-2xl font-serif text-4xl leading-tight text-navy-900">
          Non siamo riusciti a completare l&apos;operazione.
        </h1>
        <p className="mt-4 max-w-xl text-lg text-slate">
          Riprova tra qualche istante. Se il problema persiste, contattaci.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button size="lg" onClick={reset}>
            Riprova
          </Button>
          <Button asChild size="lg" variant="secondary">
            <Link href="/">Torna alla home</Link>
          </Button>
        </div>
      </Container>
    </main>
  );
}
