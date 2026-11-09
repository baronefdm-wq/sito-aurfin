// Promemoria una tantum: invia l'email usando la configurazione SMTP di .env.local.
// Uso: node scripts/promemoria-documenti.mjs [--verifica]   (--verifica controlla l'accesso senza inviare)
import { readFileSync } from "node:fs";
import path from "node:path";
import nodemailer from "nodemailer";

const env = Object.fromEntries(
  readFileSync(path.join(import.meta.dirname, "..", ".env.local"), "utf8")
    .split(/\r?\n/)
    .map((line) => line.replace(/^﻿/, "").match(/^([A-Z_]+)=(.*)$/))
    .filter(Boolean)
    .map((m) => [m[1], m[2].trim().replace(/^"(.*)"$/, "$1")]),
);

const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: Number(env.SMTP_PORT || 587),
  secure: Number(env.SMTP_PORT) === 465,
  auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
});

if (process.argv.includes("--verifica")) {
  await transporter.verify();
  console.log("Accesso SMTP riuscito: nessuna email inviata.");
} else {
  await transporter.sendMail({
    from: env.SMTP_FROM,
    to: "baronefdm@gmail.com",
    subject: "Promemoria AURFIN: documenti per il sito",
    text: [
      "Promemoria: stasera dovresti avere i documenti per il sito AURFIN.",
      "",
      "I primi tre da inviare:",
      "1. Visura aggiornata",
      "2. Iscrizione OAM (numero e data, o la comunicazione di iscrizione)",
      "3. Contratto di mandato con banche o finanziarie",
      "",
      "Puoi trascinarli nella chat con Claude. L'elenco completo è in Documenti\\AURFIN\\docs\\cosa-serve-per-la-pubblicazione.md.",
      "Prima dell'invio copri i dati personali non necessari; non inviare documenti di clienti, né password.",
    ].join("\n"),
  });
  console.log("Promemoria inviato a baronefdm@gmail.com.");
}
