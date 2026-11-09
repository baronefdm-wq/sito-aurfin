import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const euro = new Intl.NumberFormat("it-IT", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
  // In italiano le cifre a 4 cifre non avrebbero il separatore: lo forziamo per leggibilità (9.000 €).
  useGrouping: "always",
});

export function formatEuro(value: number) {
  return euro.format(value);
}

export function formatMonths(months: number) {
  if (months % 12 === 0) {
    const years = months / 12;
    return `${months} mesi (${years} ${years === 1 ? "anno" : "anni"})`;
  }
  return `${months} mesi`;
}

const dateFmt = new Intl.DateTimeFormat("it-IT", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "Europe/Rome",
});
const dateTimeFmt = new Intl.DateTimeFormat("it-IT", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Rome",
});

export function formatDate(value: string | Date) {
  return dateFmt.format(new Date(value));
}

export function formatDateTime(value: string | Date) {
  return dateTimeFmt.format(new Date(value));
}

export function absoluteUrl(path: string, base: string) {
  return new URL(path, base).toString();
}
