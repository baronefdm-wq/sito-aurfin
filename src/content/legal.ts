import { site } from "@/config/site";

/**
 * Strutture delle pagine informative e legali.
 * I testi definitivi dipendono dal ruolo e dall'attività effettiva di AURFIN:
 * qui sono predisposti indice, contenuti fattuali verificabili e segnaposto.
 * Ogni pagina ha una checklist per la pubblicazione.
 */

export type LegalBlock = { type: "p"; text: string } | { type: "placeholder"; text: string } | { type: "ul"; items: string[] };
export type LegalSection = { id: string; title: string; blocks: LegalBlock[] };
export type LegalPage = {
  slug: string;
  title: string;
  description: string;
  intro: string;
  sections: LegalSection[];
  checklist: string[];
};

const c = site.company;
const holder = c.legalName
  ? `${c.legalName}, con sede legale in ${c.registeredOffice}, C.F. e P. IVA ${c.vatNumber}, PEC ${c.pec}`
  : null;

const r = site.registration;
const registrationBlock: LegalBlock =
  r.number && r.register
    ? {
        type: "p",
        text: `Iscrizione all'${r.register} tenuto dall'OAM (Organismo degli Agenti e dei Mediatori): n. ${r.number}, data di iscrizione ${r.registeredAt}. L'iscrizione è verificabile sul sito dell'OAM (www.organismo-am.it).`,
      }
    : { type: "placeholder", text: "Numero e data di iscrizione all'Elenco OAM degli Agenti in attività finanziaria" };

export const legalPages: Record<string, LegalPage> = {
  privacy: {
    slug: "privacy",
    title: "Informativa sul trattamento dei dati personali",
    description: "Come AURFIN tratta i dati personali di chi visita il sito e invia richieste.",
    intro:
      "Questa informativa descrive come vengono trattati i dati personali raccolti tramite il sito, ai sensi del Regolamento (UE) 2016/679 (GDPR).",
    sections: [
      {
        id: "titolare",
        title: "Titolare del trattamento",
        blocks: holder
          ? [{ type: "p", text: `Titolare del trattamento è ${holder}.` }, { type: "placeholder", text: "Eventuale Responsabile della protezione dei dati (DPO) e relativo recapito" }]
          : [{ type: "placeholder", text: "Ragione sociale, sede e recapiti del titolare" }],
      },
      {
        id: "dati",
        title: "Dati trattati",
        blocks: [
          { type: "p", text: "Tramite i moduli del sito raccogliamo esclusivamente:" },
          {
            type: "ul",
            items: [
              "nome, cognome, email e telefono;",
              "soluzione di interesse, situazione lavorativa, importo e durata indicativi;",
              "preferenze di ricontatto ed eventuali note inserite liberamente;",
              "il consenso facoltativo a comunicazioni commerciali, se espresso.",
            ],
          },
          {
            type: "p",
            text: "Facoltativamente, già con la richiesta di preventivo o in seguito dall'area riservata, puoi caricare documenti come documento d'identità, codice fiscale, buste paga, cedolino della pensione o Certificazione Unica. I documenti sono conservati in un archivio privato e consultabili solo dal personale autorizzato.",
          },
          { type: "placeholder", text: "Base giuridica, tempi di conservazione e destinatari dei documenti caricati (es. intermediari mandanti)" },
        ],
      },
      {
        id: "finalita",
        title: "Finalità e basi giuridiche",
        blocks: [
          { type: "placeholder", text: "Finalità (ricontatto, gestione della richiesta, adempimenti normativi, marketing facoltativo) e relative basi giuridiche ex art. 6 GDPR" },
        ],
      },
      {
        id: "destinatari",
        title: "Destinatari e trasferimenti",
        blocks: [
          { type: "placeholder", text: "Intermediari mandanti, fornitori di servizi (hosting, email, CRM) nominati responsabili, eventuali trasferimenti extra UE" },
        ],
      },
      { id: "conservazione", title: "Tempi di conservazione", blocks: [{ type: "placeholder", text: "Periodi di conservazione per ciascuna finalità" }] },
      {
        id: "diritti",
        title: "Diritti dell'interessato",
        blocks: [
          {
            type: "p",
            text: "Puoi chiedere l'accesso ai tuoi dati, la rettifica, la cancellazione, la limitazione del trattamento, la portabilità e opporti al trattamento, nonché revocare in ogni momento il consenso a comunicazioni commerciali. Puoi inoltre proporre reclamo al Garante per la protezione dei dati personali.",
          },
          { type: "placeholder", text: "Canale dedicato per l'esercizio dei diritti" },
        ],
      },
    ],
    checklist: [
      "Validazione del testo da parte del consulente privacy / DPO",
      "Elenco dei responsabili del trattamento (hosting, email, CRM, calendario)",
      "Periodi di conservazione approvati",
      "Data di ultimo aggiornamento",
    ],
  },
  cookie: {
    slug: "cookie",
    title: "Informativa sui cookie",
    description: "Quali cookie utilizza il sito AURFIN e per quali finalità.",
    intro:
      "Il sito, nella configurazione attuale, utilizza solo cookie tecnici necessari al funzionamento. Non sono installati cookie di profilazione né strumenti di analisi o tracciamento di terze parti.",
    sections: [
      {
        id: "tecnici",
        title: "Cookie tecnici",
        blocks: [
          {
            type: "ul",
            items: [
              "aurfin_cliente — cookie di sessione dell'area clienti, impostato solo dopo l'accesso. Durata massima 8 ore. Necessario per mantenere l'autenticazione.",
              "aurfin_team e aurfin_team_sfida — cookie dello spazio riservato al personale, impostati solo durante e dopo l'accesso del personale. Durata massima 8 ore.",
            ],
          },
          {
            type: "p",
            text: "Il modulo di richiesta conserva, per la sola durata della scheda del browser (sessionStorage), le scelte non personali già fatte: soluzione, situazione lavorativa, importo e durata. Nessun dato personale viene memorizzato nel browser.",
          },
        ],
      },
      {
        id: "terze-parti",
        title: "Servizi di terze parti",
        blocks: [
          {
            type: "p",
            text: "Se in futuro venissero introdotti strumenti di statistica o marketing, saranno attivati solo dopo il consenso espresso tramite un apposito banner e descritti in questa pagina.",
          },
        ],
      },
    ],
    checklist: [
      "Verifica finale dei cookie effettivamente installati in produzione",
      "Eventuale banner di consenso, solo se si introducono cookie non tecnici",
      "Data di ultimo aggiornamento",
    ],
  },
  trasparenza: {
    slug: "trasparenza",
    title: "Trasparenza e documenti informativi",
    description: "Documentazione di trasparenza e informativa precontrattuale relativa all'attività di AURFIN.",
    intro:
      "In questa pagina sono raccolti i documenti informativi relativi all'attività di AURFIN e ai prodotti dei finanziatori mandanti.",
    sections: [
      {
        id: "intermediario",
        title: "Informazioni sull'intermediario",
        blocks: [
          { type: "p", text: "AURFIN svolge l'attività di agente in attività finanziaria ai sensi del Titolo VI-bis del D.Lgs. 385/1993 (Testo Unico Bancario)." },
          registrationBlock,
          { type: "placeholder", text: "Intermediari mandanti e tipologia di mandato" },
        ],
      },
      {
        id: "documenti",
        title: "Documenti",
        blocks: [
          {
            type: "placeholder",
            text: "Fogli informativi, guide della Banca d'Italia, informativa sui compensi e altra documentazione fornita dai mandanti",
          },
        ],
      },
      {
        id: "educazione",
        title: "Educazione finanziaria",
        blocks: [
          {
            type: "p",
            text: "Materiali divulgativi indipendenti sono disponibili sul portale di educazione finanziaria della Banca d'Italia (economiapertutti.bancaditalia.it).",
          },
        ],
      },
    ],
    checklist: [
      "Elenco dei documenti obbligatori fornito dalla compliance e dai mandanti",
      "Intermediari mandanti e tipologia di mandato inseriti",
    ],
  },
  "informativa-intermediario": {
    slug: "informativa-intermediario",
    title: "Informativa sull'intermediario",
    description: "Chi è AURFIN, quale ruolo svolge e come viene gestita la tua richiesta.",
    intro: "Da leggere prima di allegare documenti: spiega chi riceve la tua richiesta e con quale ruolo.",
    sections: [
      {
        id: "chi-siamo",
        title: "Chi siamo",
        blocks: holder
          ? [
              { type: "p", text: `${holder}.` },
              { type: "p", text: "La società svolge l'attività di agente in attività finanziaria (Titolo VI-bis del D.Lgs. 385/1993)." },
            ]
          : [{ type: "placeholder", text: "Dati identificativi della società" }],
      },
      {
        id: "iscrizione",
        title: "Iscrizione e mandanti",
        blocks: [
          registrationBlock,
          { type: "placeholder", text: "Intermediari per conto dei quali AURFIN opera e tipo di mandato" },
          { type: "placeholder", text: "Eventuali compensi e costi a carico del cliente" },
        ],
      },
      {
        id: "ruolo",
        title: "Cosa fa AURFIN e cosa fa il finanziatore",
        blocks: [
          {
            type: "ul",
            items: [
              "AURFIN illustra le soluzioni, raccoglie i documenti e presenta la richiesta.",
              "Il finanziatore valuta la richiesta, decide se concedere il finanziamento e ne stabilisce le condizioni.",
              "Inviare una richiesta o allegare documenti non comporta alcun obbligo e non garantisce un esito.",
            ],
          },
        ],
      },
      {
        id: "documenti",
        title: "Documenti che alleghi",
        blocks: [
          {
            type: "p",
            text: "I documenti servono a valutare la tua richiesta, sono conservati in un archivio privato e consultati solo dal personale autorizzato. Allega solo ciò che ti viene indicato: nelle buste paga puoi oscurare le voci non necessarie, come eventuali trattenute sindacali.",
          },
          { type: "placeholder", text: "Tempi di conservazione e destinatari dei documenti" },
        ],
      },
      {
        id: "reclami-diritti",
        title: "Reclami e diritti",
        blocks: [{ type: "p", text: "Le modalità sono indicate nelle pagine dedicate ai reclami e alla privacy." }],
      },
    ],
    checklist: [
      "Testo e contenuti minimi validati dalla compliance e dal mandante",
      "Mandanti inseriti",
      "Regole su compensi e documentazione precontrattuale confermate",
    ],
  },
  reclami: {
    slug: "reclami",
    title: "Reclami",
    description: "Come presentare un reclamo ad AURFIN e quali strumenti di risoluzione delle controversie sono disponibili.",
    intro: "Se non sei soddisfatto del servizio ricevuto puoi presentare un reclamo. Ti risponderemo entro i termini previsti.",
    sections: [
      {
        id: "come",
        title: "Come presentare un reclamo",
        blocks: [
          { type: "placeholder", text: "Canali (email dedicata, PEC, posta) e dati da indicare nel reclamo" },
          ...(c.pec ? [{ type: "p" as const, text: `Indirizzo PEC della società: ${c.pec}.` }] : []),
        ],
      },
      { id: "tempi", title: "Tempi di risposta", blocks: [{ type: "placeholder", text: "Termine di risposta applicabile" }] },
      {
        id: "abf",
        title: "Arbitro Bancario Finanziario",
        blocks: [
          {
            type: "p",
            text: "Per controversie relative a operazioni e servizi bancari e finanziari è possibile rivolgersi all'Arbitro Bancario Finanziario (ABF) alle condizioni previste: informazioni su www.arbitrobancariofinanziario.it.",
          },
          { type: "placeholder", text: "Applicabilità dell'ABF e di altri sistemi alternativi in base al ruolo e ai prodotti" },
        ],
      },
    ],
    checklist: ["Procedura reclami approvata", "Recapito dedicato ai reclami", "Termini di risposta confermati dalla compliance"],
  },
  accessibilita: {
    slug: "accessibilita",
    title: "Accessibilità",
    description: "L'impegno di AURFIN per un sito accessibile e i canali per segnalare problemi.",
    intro:
      "Il sito è progettato con l'obiettivo di rispettare le Linee guida WCAG 2.2 a livello AA: struttura semantica, navigazione completa da tastiera, focus visibile, contrasti adeguati, etichette dei moduli sempre visibili e rispetto della preferenza di riduzione del movimento.",
    sections: [
      {
        id: "stato",
        title: "Stato di conformità",
        blocks: [{ type: "placeholder", text: "Esito della verifica di accessibilità (autovalutazione o audit esterno) e data" }],
      },
      {
        id: "segnalazioni",
        title: "Segnalare un problema",
        blocks: [
          { type: "p", text: "Se incontri difficoltà nell'uso del sito, scrivici all'email indicata nella pagina Contatti, specificando la pagina e il problema riscontrato." },
          { type: "placeholder", text: "Eventuale dichiarazione di accessibilità richiesta dalla normativa applicabile" },
        ],
      },
    ],
    checklist: ["Audit di accessibilità prima del lancio", "Verifica degli obblighi applicabili (L. 4/2004 e successive modifiche)"],
  },
  "informazioni-societarie": {
    slug: "informazioni-societarie",
    title: "Informazioni societarie",
    description: "Dati identificativi della società che gestisce AURFIN.",
    intro: "Dati identificativi della società, come risultano dal Registro delle Imprese.",
    sections: [
      {
        id: "dati",
        title: "Dati della società",
        blocks: c.legalName
          ? [
              {
                type: "ul",
                items: [
                  `Denominazione: ${c.legalName}`,
                  `Forma giuridica: ${c.legalForm}`,
                  `Sede legale: ${c.registeredOffice}`,
                  `Codice fiscale e Partita IVA: ${c.vatNumber}`,
                  `Numero REA: ${c.rea}`,
                  `Capitale sociale: ${c.shareCapital}`,
                  `PEC: ${c.pec}`,
                ],
              },
            ]
          : [{ type: "placeholder", text: "Dati societari" }],
      },
      {
        id: "attivita",
        title: "Attività e iscrizioni",
        blocks: [
          { type: "p", text: "Oggetto sociale: attività di agente in attività finanziaria, disciplinata dal Titolo VI-bis del D.Lgs. 385/1993." },
          registrationBlock,
          { type: "placeholder", text: "Intermediari mandanti" },
        ],
      },
    ],
    checklist: [
      "Dati ricontrollati prima del lancio (fonte attuale: visura del 02/11/2026)",
      "Mandanti inseriti",
      "Recapiti pubblici confermati",
    ],
  },
};
