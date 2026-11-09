/**
 * Invito di calendario (iCalendar, RFC 5545). Lo stesso UID con SEQUENCE più alta
 * aggiorna l'evento già presente; METHOD:CANCEL lo rimuove.
 */
export type InviteInput = {
  appointmentId: string;
  startsAt: string;
  durationMinutes: number;
  sequence: number;
  method: "REQUEST" | "CANCEL";
  summary: string;
  description: string;
  organizer: string;
  attendee: string;
  stampedAt?: Date;
};

const escapeText = (value: string) =>
  value.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n|\r/g, "\\n");

/** Rimuove tutto ciò che potrebbe aggiungere righe o parametri in un indirizzo. */
const cleanAddress = (value: string) => value.replace(/[\s;:,"<>]/g, "").replace(/^mailto/i, "");

const stamp = (date: Date) => date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

/** Le righe oltre i 75 byte vanno spezzate senza dividere i caratteri accentati. */
function fold(line: string) {
  const parts: string[] = [];
  let current = "";
  let size = 0;
  for (const ch of line) {
    const bytes = Buffer.byteLength(ch);
    if (size + bytes > (parts.length ? 74 : 75)) {
      parts.push(current);
      current = "";
      size = 0;
    }
    current += ch;
    size += bytes;
  }
  parts.push(current);
  return parts.join("\r\n ");
}

export function buildInvite(input: InviteInput) {
  const start = new Date(input.startsAt);
  const end = new Date(start.getTime() + input.durationMinutes * 60_000);
  const lines = [
    "BEGIN:VCALENDAR",
    "PRODID:-//AURFIN//Planner//IT",
    "VERSION:2.0",
    "CALSCALE:GREGORIAN",
    `METHOD:${input.method}`,
    "BEGIN:VEVENT",
    `UID:${input.appointmentId}@aurfin`,
    `SEQUENCE:${input.sequence}`,
    `DTSTAMP:${stamp(input.stampedAt ?? new Date())}`,
    `DTSTART:${stamp(start)}`,
    `DTEND:${stamp(end)}`,
    `SUMMARY:${escapeText(input.summary)}`,
    `DESCRIPTION:${escapeText(input.description)}`,
    `ORGANIZER;CN=AURFIN:mailto:${cleanAddress(input.organizer)}`,
    `ATTENDEE;CUTYPE=INDIVIDUAL;ROLE=REQ-PARTICIPANT;PARTSTAT=NEEDS-ACTION;RSVP=TRUE:mailto:${cleanAddress(input.attendee)}`,
    `STATUS:${input.method === "CANCEL" ? "CANCELLED" : "CONFIRMED"}`,
    "TRANSP:OPAQUE",
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return lines.map(fold).join("\r\n") + "\r\n";
}
