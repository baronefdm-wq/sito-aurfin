import type { Solution } from "@/lib/domain";

/**
 * Contenuti delle pagine prodotto.
 * Le affermazioni sul funzionamento dei prodotti sono redatte su fonti
 * pubbliche (DPR 180/1950, TUB, materiali divulgativi) e marcate `review`:
 * vanno validate dalla funzione compliance prima della pubblicazione.
 */

export type ContentItem = { title?: string; text: string };

export type ContentSection = {
  id: string;
  eyebrow?: string;
  title: string;
  intro?: string;
  layout: "columns" | "list" | "steps" | "checklist" | "definition";
  items: ContentItem[];
  review?: string;
  footnote?: string;
};

export type FaqItem = { id: string; question: string; answer: string[] };

export type ProductContent = {
  slug: string;
  solution: Solution;
  eyebrow: string;
  title: string;
  lead: string;
  metaTitle: string;
  metaDescription: string;
  facts: { label: string; value: string }[];
  factsReview?: string;
  sections: ContentSection[];
  faqs: FaqItem[];
  cta: { title: string; text: string };
};

export const cessioneDelQuinto: ProductContent = {
  slug: "cessione-del-quinto",
  solution: "cessione-quinto",
  eyebrow: "Cessione del quinto",
  title: "Un prestito che si rimborsa direttamente dallo stipendio o dalla pensione",
  lead: "Con la cessione del quinto la rata mensile viene trattenuta alla fonte, prima che lo stipendio o la pensione arrivino sul conto. Ti aiutiamo a capire se è una strada da approfondire per la tua situazione e cosa valutare prima di decidere.",
  metaTitle: "Cessione del quinto: come funziona e cosa valutare",
  metaDescription:
    "Come funziona la cessione del quinto dello stipendio e della pensione, a chi può rivolgersi, quali aspetti valutare e quali documenti preparare. Consulenza con AURFIN.",
  facts: [
    { label: "Rimborso", value: "Trattenuta mensile in busta paga o sul cedolino della pensione" },
    { label: "Rata", value: "Non superiore a un quinto dello stipendio o della pensione netti" },
    { label: "Durata", value: "Fino a un massimo di 120 mesi, secondo quanto previsto dalla legge" },
    { label: "Tutele", value: "Copertura assicurativa obbligatoria prevista dalla normativa" },
  ],
  factsReview:
    "Limiti di rata e durata e obbligo assicurativo: verificare sul testo vigente del DPR 180/1950 e sui documenti informativi dei finanziatori.",
  sections: [
    {
      id: "destinatari",
      eyebrow: "A chi si rivolge",
      title: "Chi può valutarla",
      intro:
        "La cessione del quinto è pensata per chi ha un reddito da lavoro dipendente o da pensione. Rientrare in una di queste categorie non significa avere diritto al finanziamento: l'esito dipende sempre dalla valutazione del soggetto finanziatore.",
      layout: "columns",
      items: [
        {
          title: "Dipendenti pubblici e statali",
          text: "Per chi lavora in amministrazioni ed enti pubblici. Vengono di norma considerati il tipo di rapporto di lavoro e l'anzianità di servizio.",
        },
        {
          title: "Dipendenti di aziende private",
          text: "Si valutano in genere il contratto, l'anzianità, il trattamento di fine rapporto maturato e le caratteristiche dell'azienda datrice di lavoro.",
        },
        {
          title: "Pensionati",
          text: "Si considerano l'importo della pensione, l'ente che la eroga e l'età alla fine del piano di rimborso. Una parte minima della pensione resta comunque garantita.",
        },
      ],
      review: "Criteri di valutazione indicativi: confermare con i finanziatori con cui AURFIN opera.",
    },
    {
      id: "funzionamento",
      eyebrow: "Come funziona",
      title: "Il meccanismo, in quattro punti",
      layout: "definition",
      items: [
        {
          title: "La quota cedibile",
          text: "La rata non può superare un quinto dello stipendio o della pensione netti. Il calcolo esatto si basa sul certificato di stipendio o sulla comunicazione dell'ente pensionistico.",
        },
        {
          title: "La trattenuta alla fonte",
          text: "Il datore di lavoro o l'ente pensionistico trattiene ogni mese la rata e la versa direttamente al finanziatore. Non devi occuparti dei pagamenti.",
        },
        {
          title: "Le coperture assicurative",
          text: "La normativa prevede una copertura assicurativa sulla vita e, per i lavoratori dipendenti, contro il rischio di perdita dell'impiego. Tutela il rimborso del debito residuo nei casi previsti.",
        },
        {
          title: "Rata e tasso fissi",
          text: "La rata resta la stessa per tutta la durata del piano. Tasso e costi complessivi sono indicati nella documentazione informativa e nel contratto.",
        },
      ],
      review: "Verificare formulazione su quota cedibile, trattenuta e coperture assicurative (art. 54 DPR 180/1950).",
    },
    {
      id: "da-valutare",
      eyebrow: "Prima di decidere",
      title: "Gli aspetti da valutare con attenzione",
      intro: "Una buona scelta parte da poche domande chiare. Le affrontiamo insieme durante la consulenza.",
      layout: "list",
      items: [
        {
          title: "Il costo complessivo, non solo la rata",
          text: "Il TAEG (Tasso annuo effettivo globale) esprime il costo totale del finanziamento su base annua e permette di confrontare proposte diverse. Una rata più bassa può nascondere un costo totale più alto.",
        },
        {
          title: "La durata giusta",
          text: "Allungare il piano riduce la rata mensile ma aumenta gli interessi pagati nel tempo. Conviene scegliere la durata più breve compatibile con il tuo bilancio familiare.",
        },
        {
          title: "Finanziamenti già in corso",
          text: "Una cessione in corso può essere rinnovata solo a determinate condizioni e dopo che è trascorsa una parte della durata. Valutiamo insieme se e quando ha senso.",
        },
        {
          title: "Estinzione anticipata",
          text: "Puoi rimborsare in anticipo, in tutto o in parte, con una riduzione del costo totale secondo quanto previsto dalla legge e dal contratto.",
        },
        {
          title: "La documentazione informativa",
          text: "Prima della firma ricevi le informazioni precontrattuali del finanziatore, tra cui il modulo «Informazioni europee di base sul credito ai consumatori». Leggile con calma e chiedi chiarimenti.",
        },
      ],
      review: "Condizioni di rinnovo e diritti in caso di estinzione anticipata: validare riferimenti (DPR 180/1950, art. 125-sexies TUB).",
    },
    {
      id: "documenti",
      eyebrow: "Documentazione",
      title: "Documenti generalmente richiesti",
      intro:
        "Puoi allegarli già alla richiesta di preventivo oppure caricarli più tardi dall'area riservata: non è obbligatorio inviarli subito. L'elenco definitivo dipende dal finanziatore e dalla tua situazione.",
      layout: "checklist",
      items: [
        { text: "Documento di identità in corso di validità e codice fiscale" },
        { text: "Ultime buste paga oppure ultimo cedolino della pensione" },
        { text: "Certificazione Unica più recente" },
        { text: "Certificato di stipendio rilasciato dal datore di lavoro (per i dipendenti)" },
        { text: "Comunicazione della quota cedibile dell'ente pensionistico (per i pensionati)" },
        { text: "Conteggi estintivi di eventuali finanziamenti in corso" },
      ],
      footnote: "Elenco indicativo, da confermare caso per caso.",
    },
    {
      id: "passaggi",
      eyebrow: "Il percorso",
      title: "Come si svolge la richiesta",
      layout: "steps",
      items: [
        { title: "Richiesta", text: "Ci lasci pochi dati essenziali: soluzione di interesse, situazione lavorativa, importo e durata indicativi." },
        { title: "Preventivo via email", text: "Entro un giorno lavorativo ti rispondiamo con il preventivo. Se hai dubbi, nell'email trovi il link per prenotare una telefonata; altrimenti proseguiamo via email." },
        { title: "Documentazione", text: "Se decidi di andare avanti, raccogliamo i documenti necessari e li verifichiamo con te." },
        { title: "Valutazione", text: "La richiesta viene presentata al finanziatore, che svolge le proprie verifiche e decide in autonomia." },
        { title: "Eventuale proposta", text: "In caso di esito positivo ricevi la proposta con la documentazione informativa: decidi tu se firmarla." },
      ],
    },
  ],
  faqs: [
    {
      id: "cq-protestati",
      question: "Posso richiederla se ho già altri finanziamenti?",
      answer: [
        "Sì, è possibile presentare la richiesta. Il finanziatore valuterà la situazione complessiva, compresi gli impegni già in corso e le trattenute presenti in busta paga.",
        "Durante la consulenza ti aiutiamo a capire come i finanziamenti attuali incidono sulla quota disponibile.",
      ],
    },
    {
      id: "cq-datore",
      question: "Il mio datore di lavoro saprà della cessione?",
      answer: [
        "Sì. Poiché la rata viene trattenuta dallo stipendio, il datore di lavoro riceve la notifica del contratto e versa le rate al finanziatore. Per lo stesso motivo rilascia il certificato di stipendio.",
      ],
    },
    {
      id: "cq-cambio-lavoro",
      question: "Cosa succede se cambio lavoro o vado in pensione?",
      answer: [
        "In genere la cessione può proseguire sul nuovo stipendio o sulla pensione, oppure il debito residuo può essere coperto in parte dal trattamento di fine rapporto. Le modalità dipendono dal contratto e dal caso specifico.",
      ],
    },
    {
      id: "cq-tempi",
      question: "Quanto tempo serve per avere una risposta?",
      answer: [
        "Dipende dai tempi di rilascio dei documenti, in particolare del certificato di stipendio o della comunicazione dell'ente pensionistico, e dalle verifiche del finanziatore. Non possiamo garantire tempi certi, ma ti aggiorniamo a ogni passaggio.",
      ],
    },
    {
      id: "cq-costo",
      question: "Quanto costa la consulenza di AURFIN?",
      answer: [
        "Le condizioni economiche del servizio di intermediazione, se previste, ti vengono comunicate per iscritto prima di qualsiasi impegno e sono riportate nella documentazione di trasparenza.",
      ],
    },
  ],
  cta: {
    title: "Vuoi capire se la cessione del quinto fa per te?",
    text: "Indica importo e durata che hai in mente: ti rispondiamo via email con il preventivo entro un giorno lavorativo, senza impegno.",
  },
};

export const prestitoDelega: ProductContent = {
  slug: "prestito-delega",
  solution: "prestito-delega",
  eyebrow: "Prestito per delega",
  title: "La delegazione di pagamento: una soluzione da verificare caso per caso",
  lead: "Il prestito per delega si rimborsa con una trattenuta in busta paga, come la cessione del quinto, ma richiede che il datore di lavoro accetti la delega. Disponibilità e condizioni dipendono da verifiche specifiche: ti aiutiamo a capire se e come è percorribile.",
  metaTitle: "Prestito per delega (delegazione di pagamento): come funziona",
  metaDescription:
    "Cos'è il prestito con delegazione di pagamento, per chi può essere valutato, perché richiede l'accettazione del datore di lavoro e quali verifiche servono.",
  facts: [
    { label: "Per chi", value: "Lavoratori dipendenti; in genere non è previsto per i pensionati" },
    { label: "Rimborso", value: "Trattenuta in busta paga versata dal datore di lavoro" },
    { label: "Condizione", value: "Il datore di lavoro può accettare o non accettare la delega" },
    { label: "Con la cessione", value: "Può affiancarsi a una cessione del quinto, entro limiti complessivi" },
  ],
  factsReview:
    "Limiti complessivi delle trattenute e prassi degli enti: validare con riferimenti normativi e convenzioni applicabili.",
  sections: [
    {
      id: "destinatari",
      eyebrow: "A chi si rivolge",
      title: "Chi può valutarlo",
      intro:
        "Il prestito per delega non è automaticamente accessibile. Oltre alla valutazione del finanziatore, serve l'accettazione del datore di lavoro, che non è obbligato a concederla.",
      layout: "columns",
      items: [
        {
          title: "Dipendenti pubblici",
          text: "Molte amministrazioni gestiscono le deleghe secondo regole e convenzioni proprie. È il primo aspetto che verifichiamo insieme.",
        },
        {
          title: "Dipendenti privati",
          text: "L'accettazione dipende dalla disponibilità dell'azienda e, spesso, da accordi tra azienda e finanziatore. Non tutte le aziende aderiscono.",
        },
        {
          title: "Chi ha già una cessione del quinto",
          text: "La delega può affiancarsi a una cessione in corso, a condizione che le trattenute complessive restino entro i limiti consentiti.",
        },
      ],
    },
    {
      id: "funzionamento",
      eyebrow: "Come funziona",
      title: "Cosa cambia rispetto alla cessione del quinto",
      layout: "definition",
      items: [
        {
          title: "Un incarico al datore di lavoro",
          text: "Con la delega autorizzi il datore di lavoro a trattenere la rata dallo stipendio e a versarla al finanziatore. Per essere efficace, la delega deve essere accettata.",
        },
        {
          title: "Un'accettazione facoltativa",
          text: "A differenza della cessione del quinto, il datore di lavoro può decidere di non accettare la delega. Per questo la disponibilità va verificata prima di tutto il resto.",
        },
        {
          title: "Limiti complessivi",
          text: "La rata della delega si somma alle eventuali altre trattenute. L'insieme delle trattenute deve restare entro i limiti previsti, che verifichiamo sui documenti.",
        },
        {
          title: "Coperture assicurative",
          text: "Anche il prestito per delega è normalmente accompagnato da coperture assicurative, le cui condizioni sono indicate nella documentazione del finanziatore.",
        },
      ],
      review: "Natura facoltativa dell'accettazione, limiti complessivi e coperture: validare con la compliance e i finanziatori.",
    },
    {
      id: "verifiche",
      eyebrow: "Perché servono verifiche",
      title: "Le verifiche da fare prima di procedere",
      intro: "Per evitarti attese inutili, partiamo dai punti che determinano se il percorso è praticabile.",
      layout: "list",
      items: [
        { title: "Disponibilità del datore di lavoro", text: "Se l'ente o l'azienda accetta deleghe e con quali finanziatori o convenzioni." },
        { title: "Trattenute già presenti", text: "Cessioni, deleghe o altre trattenute in busta paga che riducono la quota disponibile." },
        { title: "Rapporto di lavoro", text: "Tipo di contratto, anzianità e altri elementi considerati dal finanziatore." },
        { title: "Sostenibilità della rata", text: "Quanto resta disponibile ogni mese dopo tutte le trattenute, per non appesantire il bilancio familiare." },
      ],
    },
    {
      id: "documenti",
      eyebrow: "Documentazione",
      title: "Documenti generalmente richiesti",
      intro: "Te li chiediamo solo dopo aver verificato che il percorso è praticabile.",
      layout: "checklist",
      items: [
        { text: "Documento di identità in corso di validità e codice fiscale" },
        { text: "Ultime buste paga" },
        { text: "Certificazione Unica più recente" },
        { text: "Certificato di stipendio e modulistica del datore di lavoro per la delega" },
        { text: "Contratti o conteggi di eventuali finanziamenti in corso" },
      ],
      footnote: "Elenco indicativo, da confermare caso per caso.",
    },
    {
      id: "passaggi",
      eyebrow: "Il percorso",
      title: "Come si svolge la richiesta",
      layout: "steps",
      items: [
        { title: "Richiesta", text: "Ci indichi situazione lavorativa, importo e durata che hai in mente." },
        { title: "Verifica preliminare", text: "Approfondiamo con te la disponibilità del datore di lavoro e le trattenute in corso." },
        { title: "Documentazione", text: "Se il percorso è praticabile, raccogliamo i documenti necessari." },
        { title: "Valutazione", text: "Il finanziatore valuta la richiesta; il datore di lavoro decide sull'accettazione della delega." },
        { title: "Eventuale proposta", text: "In caso di esito positivo ricevi la proposta e la documentazione informativa." },
      ],
    },
  ],
  faqs: [
    {
      id: "pd-differenza",
      question: "Qual è la differenza principale con la cessione del quinto?",
      answer: [
        "Entrambe prevedono una trattenuta in busta paga, ma il datore di lavoro è tenuto a dare corso alla cessione del quinto, mentre può scegliere se accettare o meno la delegazione di pagamento.",
      ],
    },
    {
      id: "pd-pensionati",
      question: "I pensionati possono richiedere un prestito per delega?",
      answer: [
        "In genere no: la delegazione di pagamento è uno strumento pensato per i lavoratori dipendenti. Per chi riceve una pensione si valuta di solito la cessione del quinto della pensione.",
      ],
    },
    {
      id: "pd-rifiuto",
      question: "Cosa succede se il datore di lavoro non accetta?",
      answer: [
        "La delega non può essere attivata. In quel caso valutiamo con te se esistono alternative adatte, come la sola cessione del quinto o un prestito personale, oppure se è preferibile non procedere.",
      ],
    },
    {
      id: "pd-entrambi",
      question: "Posso avere cessione del quinto e delega insieme?",
      answer: [
        "È possibile, se il datore di lavoro accetta la delega e le trattenute complessive restano entro i limiti consentiti. Lo verifichiamo sui documenti prima di presentare la richiesta.",
      ],
    },
  ],
  cta: {
    title: "Partiamo da una verifica preliminare",
    text: "Raccontaci la tua situazione: ti rispondiamo via email entro un giorno lavorativo, con chiarezza su quali verifiche servono e se ha senso procedere.",
  },
};

export const prestitiPersonali: ProductContent = {
  slug: "prestiti-personali",
  solution: "prestito-personale",
  eyebrow: "Prestiti personali",
  title: "Un prestito personale, scelto con consapevolezza",
  lead: "Il prestito personale mette a disposizione una somma da rimborsare a rate. Prima di cercare un'offerta è utile chiarire l'esigenza, l'importo davvero necessario e una rata sostenibile: è da qui che partiamo con te.",
  metaTitle: "Prestiti personali: come funzionano e come vengono valutati",
  metaDescription:
    "Come funziona un prestito personale, come viene valutata la richiesta e quali documenti preparare. Richiedi una consulenza con AURFIN.",
  facts: [
    { label: "Erogazione", value: "Somma erogata in un'unica soluzione" },
    { label: "Rimborso", value: "Rate periodiche, di norma mensili, con addebito sul conto" },
    { label: "Utilizzo", value: "Non è legato all'acquisto di un bene specifico" },
    { label: "Valutazione", value: "Basata sul merito creditizio di chi richiede il prestito" },
  ],
  sections: [
    {
      id: "esigenze",
      eyebrow: "Possibili esigenze",
      title: "Per quali progetti si valuta",
      intro: "Ogni esigenza ha il suo peso nel bilancio familiare. Ne parliamo per capire importo e durata più adatti.",
      layout: "columns",
      items: [
        { title: "Casa", text: "Lavori di ristrutturazione, arredamento, interventi di efficienza energetica." },
        { title: "Mobilità", text: "Acquisto o riparazione di un veicolo, spese di trasporto per lavoro." },
        { title: "Salute e famiglia", text: "Spese mediche, cure, eventi familiari importanti." },
        { title: "Formazione", text: "Corsi, master e percorsi di studio, per sé o per i figli." },
        { title: "Riorganizzare le rate", text: "Riunire più finanziamenti in corso, valutando con attenzione costi e durata complessiva." },
        { title: "Imprevisti", text: "Spese non programmate da affrontare senza intaccare tutti i risparmi." },
      ],
    },
    {
      id: "funzionamento",
      eyebrow: "Come funziona",
      title: "Il funzionamento generale",
      layout: "definition",
      items: [
        { title: "Importo e durata", text: "Si concordano all'inizio. La durata incide sia sulla rata sia sul costo totale." },
        { title: "Rimborso a rate", text: "Le rate vengono di norma addebitate sul conto corrente, secondo il piano di ammortamento." },
        { title: "Costi e tassi", text: "TAN, TAEG e costi accessori sono indicati nelle informazioni precontrattuali e nel contratto." },
        { title: "Diritto di recesso", text: "Per i contratti di credito ai consumatori la legge prevede un periodo di ripensamento dopo la firma, con le modalità indicate nel contratto." },
      ],
      review: "Diritto di recesso ed estinzione anticipata (artt. 125-ter e 125-sexies TUB): validare formulazione.",
    },
    {
      id: "valutazione",
      eyebrow: "La valutazione",
      title: "Come viene valutata la richiesta",
      intro: "La decisione spetta al finanziatore, che valuta il merito creditizio, cioè la capacità di rimborsare il prestito nel tempo.",
      layout: "list",
      items: [
        { title: "Reddito e stabilità", text: "Tipo e continuità del reddito, da lavoro dipendente, autonomo o da pensione." },
        { title: "Impegni in corso", text: "Altri finanziamenti, mutui e rate già presenti nel bilancio familiare." },
        { title: "Storia creditizia", text: "Il finanziatore può consultare banche dati sul credito, come i sistemi di informazioni creditizie, secondo le regole sulla privacy." },
        { title: "Sostenibilità", text: "Il rapporto tra rata e reddito disponibile, perché il rimborso resti sostenibile." },
      ],
      review: "Riferimenti a sistemi di informazioni creditizie e Centrale Rischi: validare con la compliance.",
    },
    {
      id: "documenti",
      eyebrow: "Documentazione",
      title: "Documentazione indicativa",
      layout: "checklist",
      items: [
        { text: "Documento di identità in corso di validità e codice fiscale" },
        { text: "Documenti di reddito: buste paga, cedolino della pensione o dichiarazione dei redditi" },
        { text: "Coordinate del conto per l'addebito delle rate, solo in fase di proposta" },
        { text: "Eventuali documenti sui finanziamenti in corso" },
      ],
      footnote: "Elenco indicativo, da confermare caso per caso.",
    },
  ],
  faqs: [
    {
      id: "pp-autonomi",
      question: "Possono richiederlo anche lavoratori autonomi?",
      answer: [
        "Sì, la richiesta è possibile. In questo caso il reddito viene di solito documentato con la dichiarazione dei redditi. La valutazione resta del finanziatore.",
      ],
    },
    {
      id: "pp-giustificativi",
      question: "Devo dimostrare come userò il denaro?",
      answer: [
        "Il prestito personale non è legato all'acquisto di un bene specifico. Parlarci della tua esigenza ci aiuta però a suggerirti importo e durata adeguati.",
      ],
    },
    {
      id: "pp-confronto",
      question: "Come confronto due proposte?",
      answer: [
        "Guarda prima di tutto il TAEG, che riassume il costo complessivo su base annua, e l'importo totale dovuto. Confronta proposte con la stessa durata e lo stesso importo.",
      ],
    },
    {
      id: "pp-rifiuto",
      question: "Se la richiesta non viene accolta, posso sapere perché?",
      answer: [
        "Se il rifiuto si basa sulla consultazione di una banca dati, il finanziatore è tenuto a informarti indicando la banca dati consultata. Ti aiutiamo a capire le possibili ragioni e se ha senso riprovare più avanti.",
      ],
    },
  ],
  cta: {
    title: "Parliamo del tuo progetto",
    text: "Indica importo e durata: ti rispondiamo via email con il preventivo entro un giorno lavorativo, prima di presentare qualsiasi richiesta.",
  },
};

export const products = { cessioneDelQuinto, prestitoDelega, prestitiPersonali };
