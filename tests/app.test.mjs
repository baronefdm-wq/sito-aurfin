// Test end-to-end: npm test (dopo npm run build).
// Avvia l'app su una porta dedicata con database e documenti temporanei e con un
// server SMTP finto: nessuna email esce davvero e i dati reali non vengono toccati.
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createHmac } from "node:crypto";
import { mkdtempSync, readdirSync, rmSync, statSync } from "node:fs";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import { after, before, test } from "node:test";
import { buildInvite } from "../src/lib/calendar-invite.ts";
import { getDocumentSlots } from "../src/lib/document-requirements.ts";
import { availableDays, closureReason, holidayName, isBookable, romeToIso } from "../src/lib/scheduling.ts";

const PORT = 3199;
const SMTP_PORT = 2599;
const BASE = `http://localhost:${PORT}`;
const ADMIN = "admin@test.example";
const mails = [];
let server;
let smtp;
const tmp = mkdtempSync(path.join(os.tmpdir(), "aurfin-test-"));
const storageDir = path.join(tmp, "documenti");

function startFakeSmtp() {
  return new Promise((resolve) => {
    const s = net.createServer((socket) => {
      let inData = false;
      let buffer = "";
      let message = "";
      socket.write("220 test ESMTP\r\n");
      socket.on("data", (chunk) => {
        buffer += chunk.toString("utf8");
        let i;
        while ((i = buffer.indexOf("\r\n")) >= 0) {
          const line = buffer.slice(0, i);
          buffer = buffer.slice(i + 2);
          if (inData) {
            if (line === ".") {
              inData = false;
              mails.push(message.replace(/=\r\n/g, "").replace(/=3D/g, "="));
              message = "";
              socket.write("250 ok\r\n");
            } else message += line + "\r\n";
          } else if (/^(EHLO|HELO)/i.test(line)) socket.write("250 test\r\n");
          else if (/^DATA/i.test(line)) {
            inData = true;
            socket.write("354 end with .\r\n");
          } else if (/^QUIT/i.test(line)) socket.end("221 bye\r\n");
          else socket.write("250 ok\r\n");
        }
      });
      socket.on("error", () => {});
    });
    s.listen(SMTP_PORT, "127.0.0.1", () => resolve(s));
  });
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function waitForMail(match) {
  for (let i = 0; i < 40; i++) {
    const found = mails.find((m) => m.includes(match));
    if (found) return found;
    await sleep(100);
  }
  throw new Error(`Email non ricevuta: ${match}`);
}

const quote = (over = {}) => ({
  solution: "cessione-quinto",
  workCategory: "dipendente-privato",
  amount: 15000,
  durationMonths: 60,
  firstName: "Test",
  lastName: "Cliente",
  email: "cliente@test.example",
  phone: "3330000000",
  contactPreference: "telefono",
  timeSlot: "mattina",
  privacyAck: true,
  marketingConsent: false,
  website: "",
  startedAt: Date.now() - 10_000,
  ...over,
});

const post = (url, body) =>
  fetch(BASE + url, { method: "POST", headers: { "Content-Type": "application/json", "X-Forwarded-For": `10.0.0.${Math.floor(Math.random() * 250)}` }, body: JSON.stringify(body) });

before(async () => {
  smtp = await startFakeSmtp();
  server = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "-p", String(PORT)], {
    env: serverEnv(),
    stdio: "ignore",
  });
  for (let i = 0; i < 100; i++) {
    try {
      if ((await fetch(`${BASE}/api/salute`)).ok) return;
    } catch {}
    await sleep(200);
  }
  throw new Error("Il server non è partito");
});

after(async () => {
  server?.kill();
  smtp?.close();
  await sleep(300);
  rmSync(tmp, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
});

test("le pagine principali rispondono e gli spazi riservati chiedono l'accesso", async () => {
  for (const p of ["/", "/cessione-del-quinto", "/contatti", "/informativa-intermediario", "/team/accesso", "/area-clienti/accesso"]) {
    assert.equal((await fetch(BASE + p)).status, 200, p);
  }
  assert.equal((await fetch(`${BASE}/non-esiste`)).status, 404);
  for (const [p, target] of [["/team", "/team/accesso"], ["/area-clienti", "/area-clienti/accesso"]]) {
    const res = await fetch(BASE + p, { redirect: "manual" });
    assert.equal(res.status, 307, p);
    assert.match(res.headers.get("location"), new RegExp(target));
  }
});

test("l'iscrizione OAM compare nel footer e nelle pagine informative", async () => {
  for (const p of ["/", "/chi-siamo", "/trasparenza", "/informativa-intermediario", "/informazioni-societarie"]) {
    const html = await (await fetch(BASE + p)).text();
    assert.match(html, /A14406/, p);
    assert.match(html, /07\/10\/2021/, p);
  }
});

test("con la chiave di accesso il sito è chiuso, ma il controllo di salute risponde", async () => {
  const PORT2 = 3197;
  const key = "chiave+di/prova=lunga-abbastanza";
  const gated = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "-p", String(PORT2)], {
    env: { ...serverEnv(), SITE_ACCESS_KEY: key, DATABASE_PATH: path.join(tmp, "gated.db") },
    stdio: "ignore",
  });
  try {
    const base = `http://localhost:${PORT2}`;
    let health;
    for (let i = 0; i < 100; i++) {
      try {
        health = await fetch(`${base}/api/salute`);
        break;
      } catch {
        await sleep(200);
      }
    }
    assert.equal(health.status, 200, "salute");
    assert.equal((await fetch(`${base}/`)).status, 401, "senza chiave");
    assert.equal((await fetch(`${base}/api/richieste`, { method: "POST" })).status, 401, "API senza chiave");
    // Il "+" non codificato nel link arriva come spazio: la chiave deve valere lo stesso.
    const entry = await fetch(`${base}/?accesso=${key}`, { redirect: "manual" });
    assert.equal(entry.status, 307, "link con la chiave");
    assert.match(entry.headers.get("set-cookie") ?? "", /aurfin_accesso=/);
  } finally {
    gated.kill();
  }
});

test("il sito clienti non fa riferimento allo spazio team e in live non ci sono profili demo", async () => {
  for (const p of ["/", "/area-clienti/accesso", "/sitemap.xml", "/robots.txt"]) {
    assert.doesNotMatch(await (await fetch(BASE + p)).text(), /\/team/, p);
  }
  assert.doesNotMatch(await (await fetch(`${BASE}/team/accesso`)).text(), /Profili dimostrativi/);
});

test("validazione e antispam rifiutano le richieste non valide", async () => {
  assert.equal((await post("/api/richieste", quote({ email: "non-valida" }))).status, 422);
  assert.equal((await post("/api/richieste", quote({ website: "spam" }))).status, 400);
  assert.equal((await post("/api/richieste", quote({ startedAt: Date.now() }))).status, 400);
  assert.equal((await post("/api/richieste", quote({ privacyAck: false }))).status, 422);
});

test("preventivo: salvataggio, notifica al team, caricamento controllato", async () => {
  const res = await post("/api/richieste", quote({ agentInfoAck: true, contractType: "indeterminato", incomeBand: "1500-2000", channel: "convenzione-prova" }));
  assert.equal(res.status, 201);
  const { reference, uploadToken } = await res.json();
  assert.match(reference, /^AUR-\d{4}-\d{5}$/);
  await waitForMail("To: team@test.example");

  const upload = (file, documentId = "buste-paga", token = uploadToken) => {
    const form = new FormData();
    form.append("documentId", documentId);
    form.append("file", file);
    return fetch(`${BASE}/api/richieste/documenti`, { method: "POST", headers: token ? { "X-Upload-Token": token } : {}, body: form });
  };
  const pdf = () => new File(["%PDF-1.4 prova"], "busta.pdf", { type: "application/pdf" });
  assert.equal((await upload(pdf())).status, 201);
  assert.equal((await upload(new File(["MZ falso"], "falso.pdf", { type: "application/pdf" }))).status, 422, "firma falsa");
  assert.equal((await upload(new File(["x"], "virus.exe", { type: "application/x-msdownload" }))).status, 422, "formato");
  assert.equal((await upload(pdf(), "inesistente")).status, 422, "documento non previsto");
  assert.equal((await upload(pdf(), "buste-paga", null)).status, 401, "senza token");
  assert.equal(readdirSync(storageDir, { recursive: true }).filter((f) => statSync(path.join(storageDir, f)).isFile()).length, 1);
});

test("senza presa visione dell'informativa non si caricano documenti", async () => {
  const { uploadToken } = await (await post("/api/richieste", quote({ email: "senza-ack@test.example" }))).json();
  const form = new FormData();
  form.append("documentId", "buste-paga");
  form.append("file", new File(["%PDF-1.4"], "a.pdf", { type: "application/pdf" }));
  const res = await fetch(`${BASE}/api/richieste/documenti`, { method: "POST", headers: { "X-Upload-Token": uploadToken }, body: form });
  assert.equal(res.status, 422);
});

test("documenti ed esportazioni non sono accessibili senza sessione", async () => {
  for (const p of ["/api/documenti/x", "/api/team/documenti/x"]) assert.equal((await fetch(BASE + p)).status, 401, p);
  assert.equal((await fetch(`${BASE}/api/team/esporta`)).status, 403);
  const forged = { headers: { Cookie: "aurfin_team=abc.def; aurfin_cliente=abc.def" } };
  assert.equal((await fetch(`${BASE}/api/team/esporta`, forged)).status, 403);
  assert.equal((await fetch(`${BASE}/api/team/documenti/x`, forged)).status, 401);
});

test("email di conferma al cliente attiva in produzione", async () => {
  await post("/api/richieste", quote({ email: "conferma@test.example" }));
  const mail = await waitForMail("To: conferma@test.example");
  assert.match(mail, /Abbiamo ricevuto|abbiamo ricevuto/);
  assert.doesNotMatch(mail, /15\.?000/, "nessun importo nell'email");
});

/** Stessa firma del link nell'email; l'id della pratica si legge dalla notifica al team. */
function bookingToken(requestId, secondsToExpiry = 3600) {
  const data = Buffer.from(JSON.stringify({ id: requestId, exp: Math.floor(Date.now() / 1000) + secondsToExpiry })).toString("base64url");
  return `${data}.${createHmac("sha256", serverEnv().SESSION_SECRET).update(`appuntamento:${data}`).digest("base64url")}`;
}

async function newRequestId(email) {
  const { reference } = await (await post("/api/richieste", quote({ email }))).json();
  for (let i = 0; i < 40; i++) {
    const notice = mails.find((m) => m.includes("To: team@test.example") && m.includes(reference));
    if (notice) return notice.match(/\/team\/pratiche\/([\w-]+)/)[1];
    await sleep(100);
  }
  throw new Error(`Notifica non ricevuta: ${reference}`);
}

test("il sito non offre appuntamenti: si prenota solo dal link nell'email", async () => {
  for (const p of ["/", "/contatti", "/cessione-del-quinto", "/prestiti-personali", "/come-funziona", "/faq", "/sitemap.xml"]) {
    assert.doesNotMatch(await (await fetch(BASE + p)).text(), /prenota-consulenza|\/appuntamento/, p);
  }
  assert.equal((await fetch(`${BASE}/prenota-consulenza`)).status, 404);
  assert.equal((await post("/api/consulenze", {})).status, 404);
  assert.equal((await fetch(`${BASE}/api/consulenze/disponibilita`)).status, 404);
  assert.equal((await post("/api/contatti", {})).status, 404);

  const id = await newRequestId("link@test.example");
  const genuine = bookingToken(id);
  const [data] = genuine.split(".");
  for (const bad of ["falso", `${data}.firma-falsa`, bookingToken(id, -10), bookingToken("pratica-inesistente")]) {
    assert.equal((await fetch(`${BASE}/api/appuntamento/${bad}`)).status, 404, bad);
    assert.match(await (await fetch(`${BASE}/appuntamento/${bad}`)).text(), /non è più attivo/);
  }
  const page = await fetch(`${BASE}/appuntamento/${genuine}`);
  assert.match(await page.text(), /Prenota la telefonata/);
  assert.equal(page.headers.get("referrer-policy"), "no-referrer");
  assert.match(page.headers.get("x-robots-tag"), /noindex/);
});

test("prenotazione telefonica: griglia, orari che scalano, nessuna doppia prenotazione", async () => {
  const rome = (iso, opts) => new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Rome", ...opts }).format(new Date(iso));
  const hhmm = (iso) => rome(iso, { hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
  const tokenA = bookingToken(await newRequestId("a@test.example"));
  const tokenB = bookingToken(await newRequestId("b@test.example"));
  const tokenC = bookingToken(await newRequestId("c@test.example"));
  const load = async () => (await (await fetch(`${BASE}/api/appuntamento/${tokenC}`)).json()).days;
  const book = (token, slot) =>
    post(`/api/appuntamento/${token}`, { phone: "3330000011", slot, website: "", startedAt: Date.now() - 10_000 });

  const days = await load();
  const all = days.flatMap((d) => d.slots);
  assert.ok(all.length > 0);
  for (const iso of all) {
    const t = hhmm(iso);
    assert.ok((t >= "08:30" && t <= "12:50") || (t >= "14:30" && t <= "16:30"), `orario fuori fascia: ${t}`);
    assert.equal(Number(t.slice(3)) % 10, 0, `non multiplo di 10: ${t}`);
    assert.ok(!["Sat", "Sun"].includes(rome(iso, { weekday: "short" })), "fine settimana");
    assert.ok(new Date(iso).getTime() >= Date.now() + 119 * 60_000, "meno di 2 ore di anticipo");
  }
  const fullDay = days.find((d, i) => i > 0 && d.slots.length === 40);
  assert.ok(fullDay, "un giorno completo ha 27 orari al mattino e 13 al pomeriggio");
  assert.equal(hhmm(fullDay.slots.at(-1)), "16:30");

  // Due persone sullo stesso orario nello stesso istante: ne passa una sola.
  const slot = fullDay.slots[3];
  const results = await Promise.all([book(tokenA, slot), book(tokenB, slot)]);
  assert.deepEqual(results.map((r) => r.status).sort(), [201, 409]);
  const invite = await waitForMail("To: calendario@test.example");
  assert.match(invite, /text\/calendar/);
  assert.match(invite, /method=REQUEST/i);
  assert.ok(!(await load()).flatMap((d) => d.slots).includes(slot), "lo slot prenotato sparisce");
  assert.equal((await book(tokenC, slot)).status, 409);

  // La telefonata finisce nella stessa pratica, una sola per pratica.
  const winner = results[0].status === 201 ? tokenA : tokenB;
  assert.equal((await book(winner, fullDay.slots[6])).status, 409, "già una telefonata");
  assert.match(await (await fetch(`${BASE}/appuntamento/${winner}`)).text(), /già fissata/);

  // Orari non validi rifiutati dal server.
  const offGrid = new Date(new Date(fullDay.slots[0]).getTime() + 5 * 60_000).toISOString();
  assert.equal((await book(tokenC, offGrid)).status, 409, "fuori griglia");
  assert.equal((await book(tokenC, "non-una-data")).status, 409, "data non valida");
  const tooFar = new Date(Date.now() + 60 * 86_400_000).toISOString();
  assert.equal((await book(tokenC, tooFar)).status, 409, "oltre 30 giorni");
});

test("documenti: cessione e delega dei dipendenti seguono la check-list, i prestiti restano invariati", () => {
  const ids = (solution, work) => getDocumentSlots(solution, work).map((s) => s.id);
  const checklist = ["identita", "codice-fiscale", "buste-paga", "certificazione-unica", "certificato-stipendio", "estratto-contributivo-inps", "iban", "certificati-estintivi"];
  for (const solution of ["cessione-quinto", "prestito-delega"]) {
    for (const work of ["dipendente-pubblico", "dipendente-privato"]) {
      for (const id of checklist) assert.ok(ids(solution, work).includes(id), `${solution} ${work}: ${id}`);
    }
  }
  for (const solution of ["cessione-quinto", "prestito-delega"]) {
    for (const work of ["dipendente-pubblico", "pensionato"]) {
      assert.ok(!ids(solution, work).some((id) => id === "altro" || id === "finanziamenti-in-corso"), `${solution} ${work}: solo certificati estintivi`);
    }
  }
  for (const work of ["dipendente-pubblico", "dipendente-privato"]) {
    assert.ok(ids("prestito-personale", work).includes("altro"), "prestito personale invariato");
    assert.ok(!ids("prestito-personale", work).includes("iban"), "prestito personale invariato");
    assert.ok(!ids("prestito-personale", work).includes("estratto-contributivo-inps"));
  }
  assert.ok(ids("cessione-quinto", "pensionato").includes("iban"), "IBAN anche per i pensionati");
  assert.ok(!ids("cessione-quinto", "pensionato").includes("estratto-contributivo-inps"), "niente estratto INPS per i pensionati");
});

test("festivi nazionali e chiusure del team bloccano gli orari", () => {
  for (const [date, name] of [
    ["2026-12-08", "Immacolata"],
    ["2026-12-25", "Natale"],
    ["2027-06-29", "Santi Pietro e Paolo"],
    ["2026-04-06", "Lunedì dell'Angelo"],
    ["2027-03-29", "Lunedì dell'Angelo"],
    ["2028-04-17", "Lunedì dell'Angelo"],
  ]) {
    assert.equal(holidayName(date), name, date);
  }
  assert.equal(holidayName("2026-12-09"), null);

  const now = Date.parse("2026-12-01T08:00:00Z");
  const day = (days, date) => days.find((d) => d.date === date);
  const open = availableDays(new Set(), now);
  assert.equal(day(open, "2026-12-08").slots.length, 0, "festivo senza orari");
  assert.equal(day(open, "2026-12-09").slots.length, 40, "giorno normale");
  assert.equal(isBookable(romeToIso("2026-12-08", "09:00"), now), false);

  const closures = [
    { dateFrom: "2026-12-09", dateTo: "2026-12-10", timeFrom: null, timeTo: null, reason: "Ferie" },
    { dateFrom: "2026-12-11", dateTo: "2026-12-11", timeFrom: "09:00", timeTo: "10:00", reason: "Riunione" },
  ];
  const closed = availableDays(new Set(), now, closures);
  assert.equal(day(closed, "2026-12-09").slots.length, 0);
  assert.equal(day(closed, "2026-12-10").slots.length, 0);
  assert.equal(day(closed, "2026-12-11").slots.length, 34, "6 orari in meno tra le 9:00 e le 10:00");
  assert.equal(closureReason("2026-12-11", "09:50", closures), "Riunione");
  assert.equal(closureReason("2026-12-11", "10:00", closures), null, "fine esclusa");
  assert.equal(isBookable(romeToIso("2026-12-11", "09:30"), now, closures), false);
});

test("invito di calendario: durata 8 minuti, testo protetto, annullamento", () => {
  const base = {
    appointmentId: "a-1",
    startsAt: "2026-12-09T08:30:00.000Z",
    durationMinutes: 8,
    sequence: 2,
    organizer: "agenda@test.example",
    attendee: "calendario@test.example",
    stampedAt: new Date("2026-11-05T10:00:00Z"),
  };
  const ics = buildInvite({
    ...base,
    method: "REQUEST",
    summary: "Telefonata: Rossi; Mario\nEND:VEVENT",
    description: "Riga lunghissima con accenti è è è ".repeat(6),
  });
  assert.match(ics, /METHOD:REQUEST\r\n/);
  assert.match(ics, /DTSTART:20261209T083000Z\r\n/);
  assert.match(ics, /DTEND:20261209T083800Z\r\n/);
  assert.match(ics, /SEQUENCE:2\r\n/);
  assert.equal(ics.match(/^END:VEVENT\r?$/gm).length, 1, "il testo non può aggiungere righe");
  assert.match(ics, /Rossi\\; Mario\\nEND:VEVENT/);
  for (const line of ics.split("\r\n")) assert.ok(Buffer.byteLength(line) <= 75, `riga troppo lunga: ${line}`);
  const cancel = buildInvite({ ...base, method: "CANCEL", summary: "x", description: "y" });
  assert.match(cancel, /METHOD:CANCEL\r\n/);
  assert.match(cancel, /STATUS:CANCELLED\r\n/);
});

test("il database sopravvive: i dati restano dopo il riavvio dell'app", async () => {
  const { reference } = await (await post("/api/richieste", quote({ email: "persistente@test.example" }))).json();
  assert.ok(reference);
  const next = reference.replace(/\d{5}$/, (n) => String(Number(n) + 1).padStart(5, "0"));
  const args = server.spawnargs.slice(1);
  server.kill();
  await sleep(800);
  server = spawn(process.execPath, args, { env: serverEnv(), stdio: "ignore" });
  for (let i = 0; i < 100; i++) {
    try {
      if ((await fetch(`${BASE}/api/salute`)).ok) break;
    } catch {}
    await sleep(200);
  }
  // Il contatore riparte da dove era: la prossima richiesta non riusa il codice.
  const after = await (await post("/api/richieste", quote({ email: "dopo@test.example" }))).json();
  assert.equal(after.reference, next);
});

function serverEnv() {
  return {
    ...process.env,
    DATA_MODE: "live",
    SESSION_SECRET: "segreto-di-test-lungo-almeno-trentadue-caratteri",
    DATABASE_PATH: path.join(tmp, "test.db"),
    STORAGE_DRIVER: "local",
    STORAGE_LOCAL_DIR: storageDir,
    SMTP_HOST: "127.0.0.1",
    SMTP_PORT: String(SMTP_PORT),
    SMTP_USER: "",
    SMTP_PASS: "",
    SMTP_FROM: "AURFIN Test <test@test.example>",
    NOTIFY_EMAIL_TO: "team@test.example",
    NOTIFY_WHATSAPP_TO: "",
    TEAM_ADMIN_EMAIL: ADMIN,
    TEAM_ADMIN_NAME: "Admin Test",
    CALENDAR_INVITE_TO: "calendario@test.example",
    SITE_ACCESS_KEY: "",
  };
}
