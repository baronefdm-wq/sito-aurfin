# AURFIN — sito, area clienti e spazio team

Web app per AURFIN (Aurora Finance Agente in Attività Finanziaria S.r.l.): sito pubblico,
percorso di richiesta di preventivo, risposta via email con link per prenotare una telefonata,
area clienti e spazio team.

Stack: Next.js 16 (App Router, TypeScript), Tailwind CSS 4, componenti accessibili in stile
shadcn/ui (Radix), React Hook Form + Zod.

## Avvio

```bash
npm install
cp .env.example .env.local   # su Windows: copy .env.example .env.local
npm run dev                  # http://localhost:3000
```

Build di produzione:

```bash
npm run build
npm start
```

Controlli: `npx tsc --noEmit` · `npm run lint` · `npm test`. Serve Node.js 22.13 o superiore.

## Modalità

| Variabile | Valori | Effetto |
|---|---|---|
| `DATA_MODE` | `demo` (predefinito) | Database `data/aurfin-demo.db` con **dati sintetici** e profili dimostrativi senza password. Banner "Ambiente dimostrativo". |
| | `live` | Database `data/aurfin.db`, vuoto. Nessun profilo dimostrativo. Accessi veri. Richiede `SESSION_SECRET`, l'invio email e `TEAM_ADMIN_EMAIL`. |
| `NEXT_PUBLIC_REVIEW_MODE` | `true` (predefinito) / `false` | Mostra segnaposto, note "Da validare" e checklist per la revisione interna. Da disattivare solo a contenuti approvati. |

Per ricominciare da zero la demo: fermare l'app e cancellare `data/aurfin-demo.db*`.

## Cosa è operativo

- Sito pubblico, SEO, configuratore della richiesta (**nessun calcolo di rata o costi**).
- **Database permanente** SQLite (`src/lib/server/store.ts`): richieste, documenti, storico, utenti e impostazioni restano dopo il riavvio.
- **Preventivo in 6 passaggi** con pre-qualifica facoltativa e documenti facoltativi. Per allegare serve la presa visione dell'informativa sull'intermediario, controllata anche sul server. Validazione client e server, antispam, limite di invii.
- **Risposta con il preventivo** (scheda pratica → «Rispondi con il preventivo»): il consulente scrive il testo e lo invia al cliente; l'email contiene il link personale per prenotare la telefonata, il testo resta nelle note e la pratica passa a «Primo contatto». Chi scrive da un'altra casella può copiare il link dalla stessa scheda. Sul sito, come recapito per informazioni, c'è solo l'email (`contacts.email` in `site.ts`).
- **Accessi**
  - Clienti: nessuna password. Il profilo nasce con la prima richiesta; accedono con un link via email (30 minuti, monouso, con clic di conferma).
  - Team: password (scrypt, minimo 12 caratteri) più codice via email (10 minuti, massimo 5 tentativi). Le sessioni decadono al cambio password o alla disattivazione.
  - Primo amministratore: impostare `TEAM_ADMIN_EMAIL` e usare "Primo accesso o password dimenticata". Gli altri si invitano da **Spazio team → Utenti**.
- **Documenti**: controlli su tipo, estensione, firma binaria, 10 MB per file, 3 per documento, 20 per pratica. Apertura solo con sessione e permessi. L'amministratore può eliminarli.
- **Spazio team**: priorità delle richieste (attesa e completezza, **non è una valutazione del cliente**), spunti per il colloquio, stati, assegnazione manuale o automatica, note, appuntamenti, storico, esportazione CSV.
- **Telefonate solo dal link nell'email e planner** (`/appuntamento/<link firmato>`, `/team/planner`): la pagina non è collegata dal sito e non è indicizzata. Il link è legato a una pratica, vale 30 giorni (`src/lib/server/booking-link.ts`), smette di funzionare se la pratica si chiude e consente una telefonata in programma per volta. Lunedì-venerdì, una chiamata da 8 minuti ogni 10, 8:30-12:50 e 14:30-16:30, da 2 ore a 30 giorni di anticipo, sempre in ora italiana (`src/lib/scheduling.ts`). Il calendario è unico: la tabella `slot_locks` impedisce le doppie prenotazioni e un orario occupato sparisce dalla pagina. Il team sposta o annulla dal planner e fissa telefonate dalla pratica; annullando, l'orario torna libero. I consulenti vedono come «Occupato» le telefonate dei colleghi. I festivi nazionali, compreso il Lunedì dell'Angelo, e il patrono di Roma (29 giugno) sono esclusi in automatico; le chiusure (ferie, riunioni, festività locali) le inserisce un amministratore dal planner. Le telefonate già fissate non vengono annullate: il planner le segnala da spostare.
- **Calendario esterno**: con `CALENDAR_INVITE_TO` ogni telefonata prenotata, spostata o annullata genera un invito via email che aggiorna il calendario di quell'indirizzo (es. Google Calendar). L'evento contiene nome, codice e link allo spazio team, non il telefono. Le pratiche d'esempio sono escluse.
- **Rinnovi** (`/team/rinnovi`): registrando il finanziamento erogato, la pratica compare con la data stimata di rinnovo e il consenso commerciale. La regola è `RENEWAL_FRACTION` in `src/lib/domain.ts`, da validare.
- **Cruscotto** (`/team/cruscotto`): richieste, tempo di primo contatto, conversione, erogato, carico, canali (`/richiesta-preventivo?canale=codice`) e pratiche ferme.
- **Email ai clienti**: conferma, cambi di stato e documenti richiesti, solo codice e stato; il preventivo è l'unica email che può contenere importi. Attivabili in Notifiche e impostazioni; in demo partono spente.
- **Attività automatiche** ogni ora (`src/lib/server/jobs.ts`): solleciti (`FIRST_CONTACT_ALERT_HOURS`, predefinito 24), avvisi di rinnovo, cancellazione dei documenti di pratiche chiuse (solo se è impostata `DOCUMENT_RETENTION_DAYS`).
- **Controlli**: `npm test` (test end-to-end con database temporaneo e server email finto, dopo `npm run build`), `npm run backup` (copia di database e documenti in `backup/`, da conservare cifrata), `/api/salute` per il monitoraggio.

## Limiti da conoscere

- **Una sola istanza**: il database è un file e i dati sono tenuti anche in memoria. Serve un hosting con disco permanente; per più istanze occorre passare a PostgreSQL mantenendo le funzioni di `store.ts`.
- **Database e documenti non sono cifrati dall'app**: serve la cifratura del disco o di uno storage gestito.
- **Storage documenti locale**: attivo di default solo in sviluppo; in produzione impostare `STORAGE_DRIVER=local` con un disco protetto, oppure sostituire `putObject`/`getObject`/`deleteObject` con un bucket privato con antivirus.
- **Codice via email per il team**: valido come secondo passaggio, ma debole se la casella è compromessa. Valutare un'app di autenticazione.
- **Un cliente vede l'ultima richiesta**: con più pratiche, l'area clienti mostra la più recente.
- Calendario esterno, firma elettronica, SPID/CIE e collegamento ai portali dei mandanti non sono inclusi.

Elenco completo di documenti, dati e servizi: [docs/cosa-serve-per-la-pubblicazione.md](docs/cosa-serve-per-la-pubblicazione.md).

## Pannello: situazione di ogni pratica

Dall'elenco (riga interamente cliccabile) si apre la scheda della pratica con: condizioni indicate
dal cliente (soluzione, situazione lavorativa, importo, durata, preferenze), avanzamento documenti
con l'elenco dei mancanti, prossimo passo suggerito, contatti rapidi (chiamata, email, WhatsApp),
documenti allegati apribili, richiesta di documenti aggiuntivi, note, appuntamenti e storico.

## Notifiche al personale (email e WhatsApp)

Ogni nuovo preventivo, messaggio dal modulo contatti, richiesta di consulenza, proposta (stato
"Proposta disponibile") e documento caricato dal cliente genera una notifica, inviata dopo la
risposta al visitatore. Gli amministratori vedono canali, registro e un pulsante di prova in
**Spazio team → Notifiche**. Se un canale non è configurato il registro lo indica: nessun invio simulato.

- **Email (SMTP)**: in `.env.local` impostare `NOTIFY_EMAIL_TO` (anche più indirizzi separati da
  virgola), `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`. Va bene la casella
  aziendale del provider (es. Aruba, Register, Microsoft 365, Google Workspace).
- **WhatsApp (WhatsApp Business Cloud API di Meta)**: servono un account Meta Business, un numero
  WhatsApp Business dedicato e un **modello di messaggio approvato** con due variabili
  (`{{1}}` riepilogo, `{{2}}` link al pannello). Impostare `NOTIFY_WHATSAPP_TO` (numeri senza `+`,
  es. `393331234567`), `WHATSAPP_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_TEMPLATE`.
  Un normale numero WhatsApp personale non può essere usato per invii automatici.

Riservatezza: WhatsApp riceve solo tipo di evento, codice e link; l'email aggiunge il nome del
richiedente. Documenti, recapiti e testi dei messaggi non escono dal pannello. Credenziali solo
in `.env.local`, mai nel codice.

## Due spazi separati: clienti e team

| | Area clienti | Spazio team |
|---|---|---|
| Indirizzo | `/area-clienti` (link «Area clienti» nel sito) | `/team` (non collegato dal sito) |
| Accesso | `/area-clienti/accesso` | `/team/accesso` |
| Sessione | cookie `aurfin_cliente` | cookie `aurfin_team` |
| Documenti | `/api/documenti/[id]` (solo i propri) | `/api/team/documenti/[id]` |

Le sessioni sono indipendenti: un accesso cliente non apre lo spazio team e viceversa (verifica
sul server, non solo nell'interfaccia). Il sito pubblico e l'area clienti non contengono link o
riferimenti allo spazio team, che è escluso dall'indicizzazione.

Facoltativo: con `TEAM_HOST=team.aurfin.it` lo spazio team risponde solo su quell'indirizzo
(su quello del sito restituisce 404) e le notifiche puntano lì.

## Regole di autorizzazione

- **Cliente**: solo la propria pratica; mai note interne né storico operativo.
- **Consulente**: legge le pratiche assegnate a sé e quelle non assegnate; modifica solo le
  proprie; può prendere in carico le non assegnate. Le pratiche di colleghi restituiscono 404.
- **Amministratore**: tutto, assegna a qualunque consulente, vede "Pubblicazione e integrazioni".

Le regole sono in `src/lib/server/repository.ts` (`canRead`, `canManage`, `canAssign`).

## Integrazioni: dove collegarle

| Servizio | Punto di aggancio |
|---|---|
| Database | Implementare le funzioni di `src/lib/server/repository.ts` su DB reale (stesse firme). |
| Autenticazione | Sostituire `src/lib/server/session.ts` / `auth.ts` e `credentialsLogin` / `requestPasswordReset` in `auth-actions.ts`. |
| Storage documenti | Sostituire `putObject` / `getObject` in `src/lib/server/storage.ts` con un bucket privato (cifratura a riposo, URL firmati a scadenza breve, scansione antivirus) e definire i tempi di conservazione. |
| Email | Conferme di ricezione, notifiche al personale, inviti agli appuntamenti. |
| Calendario | Disponibilità dei consulenti nella pagina "Richiedi una consulenza". |
| Simulatore con rata | Solo con parametri approvati: estendere `src/components/simulator/request-configurator.tsx` dichiarando ipotesi e limiti. |

Nessun dato personale viene salvato in `localStorage`; in `sessionStorage` restano solo le
scelte non personali del modulo (soluzione, categoria, importo, durata). Nessun servizio di
terze parti o tracciamento è incluso.

## Configurazione aziendale

Tutti i dati di identità, recapiti e iscrizioni sono in **`src/config/site.ts`**. Ciò che è
`null` non viene mostrato (o compare come segnaposto in modalità revisione). Il logo è un SVG
ricostruito dalla tavola di identità in `src/components/brand/logo.tsx`: per usare il file
ufficiale, salvarlo in `public/brand/` e sostituire il componente.

## Checklist per la pubblicazione

Dati inseriti dalla visura del 02/11/2026 (stato: attiva) e dalla scheda dell'elenco OAM:
ragione sociale, forma giuridica, sede legale, C.F./P. IVA, REA, capitale sociale, PEC, ruolo di
agente in attività finanziaria, iscrizione OAM n. A14406 del 07/10/2021.

Ancora necessari:
1. **Intermediari mandanti** e tipo di mandato.
2. Presidio quotidiano di info@aurfin.it (unico recapito sul sito, riceve le risposte dei clienti).
3. Recapito e procedura per i **reclami**.
4. Testi legali definitivi: privacy (con DPO/responsabili e tempi di conservazione), cookie,
   trasparenza (documenti dei mandanti), reclami, accessibilità.
5. Validazione compliance dei contenuti marcati "Da validare" (prodotti, FAQ, ruolo).
6. Approvazione o sostituzione delle guide in bozza (oggi `status: "bozza"`, non indicizzate).
7. Eventuale team (solo persone reali) e logo in formato vettoriale ufficiale.
8. Integrazioni: database, autenticazione, storage privato, email, calendario.
9. `SESSION_SECRET`, `DATA_MODE=live`, `NEXT_PUBLIC_REVIEW_MODE=false`, `NEXT_PUBLIC_SITE_URL`.
10. Ultimo controllo su organismo-am.it che l'iscrizione risulti attiva.

La stessa checklist, aggiornata automaticamente dalla configurazione, è visibile agli
amministratori in **Spazio team → Pubblicazione e integrazioni**.
