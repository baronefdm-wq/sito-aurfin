import { NextResponse } from "next/server";
import { bookingSchema } from "@/lib/schemas";
import { readBookingToken } from "@/lib/server/booking-link";
import { emailAppointmentChanged } from "@/lib/server/client-emails";
import { syncAppointmentToCalendar } from "@/lib/server/notifications";
import { bookingEvent } from "@/lib/server/notify-events";
import { handlePublicSubmission } from "@/lib/server/public-endpoint";
import { bookCallFromLink, getAvailability, getRequestForBooking } from "@/lib/server/repository";

const invalidLink = () => NextResponse.json({ error: "Questo link non è valido o è scaduto." }, { status: 404 });

/** Solo chi ha il link dell'email vede gli orari liberi e può prenotare. */
function requestIdFrom(token: string) {
  const id = readBookingToken(token);
  return id && getRequestForBooking(id) ? id : null;
}

export async function GET(_request: Request, context: RouteContext<"/api/appuntamento/[token]">) {
  const { token } = await context.params;
  if (!requestIdFrom(token)) return invalidLink();
  return NextResponse.json({ days: getAvailability() }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request, context: RouteContext<"/api/appuntamento/[token]">) {
  const { token } = await context.params;
  const requestId = requestIdFrom(token);
  if (!requestId) return invalidLink();
  return handlePublicSubmission(request, {
    name: "appuntamento",
    schema: bookingSchema,
    save: (data) => {
      const { request: r, appointment } = bookCallFromLink(requestId, data);
      return {
        reference: r.reference,
        extra: { startsAt: appointment.startsAt },
        notify: bookingEvent(r),
        afterSave: () =>
          Promise.all([emailAppointmentChanged(r, appointment.startsAt, "fissata"), syncAppointmentToCalendar(r, appointment, "aggiorna")]),
      };
    },
  });
}
