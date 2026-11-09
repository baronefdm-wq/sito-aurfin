import { cessioneDelQuinto, prestitiPersonali, prestitoDelega, type FaqItem } from "@/content/products";

export type FaqCategory = { id: string; title: string; items: FaqItem[] };

export const generalFaqs: FaqItem[] = [
  {
    id: "g-ruolo",
    question: "Che cosa fa AURFIN, esattamente?",
    answer: [
      "AURFIN svolge un'attività di intermediazione del credito: ti ascolta, ti aiuta a capire le soluzioni disponibili, raccoglie la documentazione e segue la richiesta presso il soggetto finanziatore.",
      "Non è AURFIN a concedere il finanziamento: la valutazione e la decisione finale spettano sempre al finanziatore.",
    ],
  },
  {
    id: "g-impegno",
    question: "Inviare una richiesta mi impegna a qualcosa?",
    answer: [
      "No. La richiesta serve a ricevere via email il preventivo, entro un giorno lavorativo. Puoi decidere in qualsiasi momento di non proseguire.",
    ],
  },
  {
    id: "g-garanzie",
    question: "Potete garantirmi che il finanziamento verrà concesso?",
    answer: [
      "No, e diffida di chi lo promette. L'esito dipende dalla valutazione del finanziatore. Il nostro compito è aiutarti a presentare una richiesta chiara e completa e spiegarti ogni passaggio.",
    ],
  },
  {
    id: "g-simulatore",
    question: "Perché il configuratore non mostra la rata?",
    answer: [
      "Rata, TAN e TAEG dipendono dalla tua situazione e dalle condizioni del finanziatore. Preferiamo non mostrarti numeri che potrebbero non corrispondere alla proposta reale: li riceverai nella documentazione informativa, se la richiesta prosegue.",
    ],
  },
];

const documentFaqs: FaqItem[] = [
  {
    id: "d-quando",
    question: "Quando devo inviare i documenti?",
    answer: [
      "Quando preferisci. Puoi allegarli già alla richiesta di preventivo, così il consulente può valutare la tua situazione più rapidamente, oppure caricarli in un secondo momento dall'area riservata. Non è obbligatorio inviarli subito e non ti chiediamo coordinate bancarie.",
    ],
  },
  {
    id: "d-come",
    question: "Come invio i documenti in modo sicuro?",
    answer: [
      "Attraverso l'area riservata, quando il caricamento è attivo, oppure con le modalità che ti indica il tuo consulente. Non inviare documenti tramite canali non concordati.",
    ],
  },
  {
    id: "d-stato",
    question: "Come posso seguire l'avanzamento della richiesta?",
    answer: [
      "Nell'area riservata trovi lo stato della richiesta, l'elenco dei documenti, i prossimi appuntamenti e i contatti del consulente assegnato. Il consulente ti aggiorna anche nei passaggi importanti.",
    ],
  },
];

const privacyFaqs: FaqItem[] = [
  {
    id: "p-dati",
    question: "Come vengono trattati i miei dati?",
    answer: [
      "I dati che ci fornisci servono a ricontattarti e a gestire la tua richiesta, come descritto nell'informativa privacy. Il consenso a ricevere comunicazioni commerciali è separato e facoltativo.",
    ],
  },
  {
    id: "p-revoca",
    question: "Posso chiedere la cancellazione dei miei dati?",
    answer: [
      "Sì. Puoi esercitare i diritti previsti dalla normativa sulla protezione dei dati con le modalità indicate nell'informativa privacy.",
    ],
  },
  {
    id: "p-reclami",
    question: "Come posso presentare un reclamo?",
    answer: ["Le modalità e i tempi di risposta sono descritti nella pagina dedicata ai reclami."],
  },
];

export const faqCategories: FaqCategory[] = [
  { id: "generali", title: "Informazioni generali", items: generalFaqs },
  { id: "cessione-del-quinto", title: "Cessione del quinto", items: cessioneDelQuinto.faqs },
  { id: "prestito-delega", title: "Prestito per delega", items: prestitoDelega.faqs },
  { id: "prestiti-personali", title: "Prestiti personali", items: prestitiPersonali.faqs },
  { id: "documenti", title: "Documenti e avanzamento della richiesta", items: documentFaqs },
  { id: "privacy", title: "Privacy e assistenza", items: privacyFaqs },
];
