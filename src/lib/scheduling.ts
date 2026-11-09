/**
 * Regole delle consulenze telefoniche, sempre in ora italiana
 * indipendentemente dal fuso del server o del browser.
 * Lunedì-venerdì, una chiamata da 8 minuti ogni 10:
 * mattina 8:30-12:50 (fine entro le 13), pomeriggio 14:30-16:30 (ultimo appuntamento).
 */
const TIME_ZONE = "Europe/Rome";

export const CALL_MINUTES = 8;
export const SLOT_INTERVAL_MINUTES = 10;
export const MIN_NOTICE_MINUTES = 120;
export const MAX_ADVANCE_DAYS = 30;
export const CALL_HOURS_LABEL = "Dal lunedì al venerdì, festivi esclusi, 8:30-13:00 e 14:30-16:30";

const PERIODS = [
  { from: 8 * 60 + 30, lastStart: 12 * 60 + 50 },
  { from: 14 * 60 + 30, lastStart: 16 * 60 + 30 },
];

const pad = (n: number) => String(n).padStart(2, "0");
const toTime = (minutes: number) => `${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`;

function buildTimes(period: { from: number; lastStart: number }) {
  const times: string[] = [];
  for (let m = period.from; m <= period.lastStart; m += SLOT_INTERVAL_MINUTES) times.push(toTime(m));
  return times;
}

export const MORNING_TIMES = buildTimes(PERIODS[0]);
export const AFTERNOON_TIMES = buildTimes(PERIODS[1]);
export const SLOT_TIMES = [...MORNING_TIMES, ...AFTERNOON_TIMES];

const romeParts = new Intl.DateTimeFormat("en-CA", {
  timeZone: TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});

function parts(date: Date) {
  const map = Object.fromEntries(romeParts.formatToParts(date).map((p) => [p.type, p.value]));
  return { date: `${map.year}-${map.month}-${map.day}`, time: `${map.hour}:${map.minute}`, second: map.second };
}

export const romeDate = (value: string | Date) => parts(new Date(value)).date;
export const romeTime = (value: string | Date) => parts(new Date(value)).time;

/** Giorno e ora italiani → istante UTC, gestendo anche il cambio dell'ora legale. */
export function romeToIso(date: string, time: string) {
  const target = Date.parse(`${date}T${time}:00Z`);
  let guess = target;
  for (let i = 0; i < 2; i++) {
    const p = parts(new Date(guess));
    guess += target - Date.parse(`${p.date}T${p.time}:${p.second}Z`);
  }
  return new Date(guess).toISOString();
}

export function addDays(date: string, days: number) {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

const weekday = (date: string) => new Date(`${date}T12:00:00Z`).getUTCDay();

export const isWorkday = (date: string) => weekday(date) >= 1 && weekday(date) <= 5;

export function mondayOf(date: string) {
  return addDays(date, -((weekday(date) + 6) % 7));
}

export const isValidDate = (value: string) =>
  /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T12:00:00Z`));

/** L'orario appartiene alla griglia degli appuntamenti? */
export function isGridSlot(iso: string) {
  const when = new Date(iso);
  if (Number.isNaN(when.getTime())) return false;
  return isWorkday(romeDate(when)) && SLOT_TIMES.includes(romeTime(when)) && when.getUTCSeconds() === 0;
}

// ---------- Festivi e chiusure ----------

const FIXED_HOLIDAYS: Record<string, string> = {
  "01-01": "Capodanno",
  "01-06": "Epifania",
  "04-25": "Festa della Liberazione",
  "05-01": "Festa del Lavoro",
  "06-02": "Festa della Repubblica",
  // Patrono di Roma, sede della società: festività locale.
  "06-29": "Santi Pietro e Paolo",
  "08-15": "Ferragosto",
  "11-01": "Ognissanti",
  "12-08": "Immacolata",
  "12-25": "Natale",
  "12-26": "Santo Stefano",
};

/** Lunedì dell'Angelo: giorno dopo la Pasqua (calcolo gregoriano anonimo). */
function easterMonday(year: number) {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return addDays(`${year}-${pad(month)}-${pad(day)}`, 1);
}

/** Festività nazionale italiana del giorno, oppure null. */
export function holidayName(date: string) {
  if (date === easterMonday(Number(date.slice(0, 4)))) return "Lunedì dell'Angelo";
  return FIXED_HOLIDAYS[date.slice(5)] ?? null;
}

/** Chiusura decisa dal team: da un giorno a un altro, tutto il giorno oppure in una fascia (fine esclusa). */
export type ClosureRule = { dateFrom: string; dateTo: string; timeFrom: string | null; timeTo: string | null; reason: string };

/** Motivo per cui un orario è chiuso, oppure null se è aperto. */
export function closureReason(date: string, time: string, closures: ClosureRule[] = []) {
  const holiday = holidayName(date);
  if (holiday) return holiday;
  const rule = closures.find(
    (c) => date >= c.dateFrom && date <= c.dateTo && (!c.timeFrom || !c.timeTo || (time >= c.timeFrom && time < c.timeTo)),
  );
  return rule ? rule.reason || "Chiuso" : null;
}

/** Il cliente può prenotare quell'orario adesso? (griglia, chiusure, 2 ore di preavviso, 30 giorni) */
export function isBookable(iso: string, now = Date.now(), closures: ClosureRule[] = []) {
  if (!isGridSlot(iso) || closureReason(romeDate(iso), romeTime(iso), closures)) return false;
  const time = new Date(iso).getTime();
  return (
    time >= now + MIN_NOTICE_MINUTES * 60_000 && romeDate(iso) <= addDays(romeDate(new Date(now)), MAX_ADVANCE_DAYS)
  );
}

/** Tutti gli orari prenotabili, raggruppati per giorno; `occupied` contiene gli istanti già presi. */
export function availableDays(occupied: Set<string>, now = Date.now(), closures: ClosureRule[] = []) {
  const today = romeDate(new Date(now));
  const days: { date: string; slots: string[] }[] = [];
  for (let i = 0; i <= MAX_ADVANCE_DAYS; i++) {
    const date = addDays(today, i);
    if (!isWorkday(date)) continue;
    const slots = SLOT_TIMES.map((t) => romeToIso(date, t)).filter((iso) => isBookable(iso, now, closures) && !occupied.has(iso));
    days.push({ date, slots });
  }
  return days;
}

const dayFormat = new Intl.DateTimeFormat("it-IT", { timeZone: "UTC", weekday: "long", day: "numeric", month: "long" });
const dayShortFormat = new Intl.DateTimeFormat("it-IT", { timeZone: "UTC", weekday: "short", day: "numeric", month: "short" });

/** "giovedì 5 novembre" a partire da AAAA-MM-GG. */
export const formatDay = (date: string) => dayFormat.format(new Date(`${date}T12:00:00Z`));
export const formatDayShort = (date: string) => dayShortFormat.format(new Date(`${date}T12:00:00Z`));
/** "giovedì 5 novembre alle 9:40" in ora italiana. */
export const formatAppointment = (iso: string) => `${formatDay(romeDate(iso))} alle ${romeTime(iso).replace(/^0/, "")}`;
