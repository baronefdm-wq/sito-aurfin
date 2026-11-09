import type { Metadata } from "next";
import Link from "next/link";
import { Clock, Phone } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { BookingForm } from "@/components/forms/booking-form";
import { Container } from "@/components/ui/primitives";
import { site } from "@/config/site";
import { CALL_HOURS_LABEL, CALL_MINUTES, formatAppointment } from "@/lib/scheduling";
import { readBookingToken } from "@/lib/server/booking-link";
import { getRequestForBooking } from "@/lib/server/repository";

export const metadata: Metadata = {
  title: "Prenota la telefonata",
  robots: { index: false, follow: false },
};

/** Pagina raggiungibile solo dal link nell'email del preventivo: non è collegata dal sito. */
export default async function BookingLinkPage({ params }: PageProps<"/appuntamento/[token]">) {
  const { token } = await params;
  const id = readBookingToken(token);
  const booking = id ? getRequestForBooking(id) : null;

  return (
    <>
      <header className="border-b border-line bg-paper">
        <Container className="flex h-[4.5rem] items-center">
          <Logo />
        </Container>
      </header>
      <main id="contenuto" tabIndex={-1} className="flex-1 focus:outline-none">
        <Container className="max-w-3xl py-10 sm:py-14">
          {!booking ? (
            <>
              <h1 className="font-serif text-3xl text-navy-900 sm:text-4xl">Questo link non è più attivo</h1>
              <p className="mt-4 text-lg leading-relaxed text-slate">
                Il link potrebbe essere scaduto oppure la pratica è stata chiusa.{" "}
                {site.contacts.email ? (
                  <>
                    Scrivici a{" "}
                    <a href={`mailto:${site.contacts.email}`} className="font-medium text-teal-700 underline underline-offset-2">
                      {site.contacts.email}
                    </a>{" "}
                    e ti aiutiamo.
                  </>
                ) : (
                  "Rispondi all'email che hai ricevuto da AURFIN e ti aiutiamo."
                )}
              </p>
            </>
          ) : booking.appointment ? (
            <>
              <h1 className="font-serif text-3xl text-navy-900 sm:text-4xl">La tua telefonata è già fissata</h1>
              <p className="mt-5 flex items-start gap-2.5 text-lg text-navy-900">
                <Phone aria-hidden className="mt-1 size-5 shrink-0 text-teal-700" />
                <span className="first-letter:uppercase">{formatAppointment(booking.appointment.startsAt)}</span>
              </p>
              <p className="mt-4 leading-relaxed text-slate">
                Ti chiamiamo noi al numero indicato. Se devi spostarla, rispondi all&apos;email con il preventivo.
              </p>
            </>
          ) : (
            <>
              <h1 className="font-serif text-3xl text-navy-900 sm:text-4xl">Prenota la telefonata</h1>
              <p className="mt-3 text-lg leading-relaxed text-slate">
                Scegli un orario libero per parlare del preventivo della richiesta {booking.request.reference}.
              </p>
              <ul className="mt-5 space-y-2 leading-relaxed text-slate">
                <li className="flex gap-3">
                  <Phone aria-hidden className="mt-1 size-5 shrink-0 text-teal-700" />
                  <span>Ti chiamiamo noi. La telefonata dura circa {CALL_MINUTES} minuti.</span>
                </li>
                <li className="flex gap-3">
                  <Clock aria-hidden className="mt-1 size-5 shrink-0 text-teal-700" />
                  <span>{CALL_HOURS_LABEL}, con almeno 2 ore di anticipo e fino a 30 giorni.</span>
                </li>
              </ul>
              <div className="mt-8 rounded-lg border border-line bg-white p-5 shadow-soft sm:p-8">
                <BookingForm token={token} defaultPhone={booking.request.contact.phone ?? ""} />
              </div>
            </>
          )}
        </Container>
      </main>
      <footer className="border-t border-line bg-paper">
        <Container className="py-6 text-sm leading-relaxed text-slate">
          {site.company.legalName} ·{" "}
          <Link href="/privacy" target="_blank" className="text-teal-700 underline underline-offset-2">
            Informativa privacy<span className="sr-only"> (si apre in una nuova scheda)</span>
          </Link>
        </Container>
      </footer>
    </>
  );
}
