/**
 * Area editoriale. Tutti gli articoli presenti sono BOZZE DIMOSTRATIVE:
 * hanno `status: "bozza"`, mostrano un avviso visibile, sono esclusi da
 * sitemap e indicizzazione e vanno verificati prima della pubblicazione.
 */

export const guideCategories = {
  "cessione-del-quinto": "Cessione del quinto",
  prestiti: "Prestiti e delega",
  "documenti-e-pratiche": "Documenti e pratiche",
  "educazione-finanziaria": "Educazione finanziaria",
} as const;
export type GuideCategory = keyof typeof guideCategories;

export type GuideBlock =
  | { type: "p"; text: string }
  | { type: "h2"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "callout"; text: string };

export type Guide = {
  slug: string;
  title: string;
  excerpt: string;
  category: GuideCategory;
  status: "bozza" | "pubblicata";
  readingMinutes: number;
  updatedAt: string | null;
  body: GuideBlock[];
};

export const guides: Guide[] = [
  {
    slug: "domande-prima-della-cessione-del-quinto",
    title: "Cinque domande da porsi prima di richiedere una cessione del quinto",
    excerpt: "Dalla durata al costo complessivo: una traccia per arrivare alla consulenza con le idee più chiare.",
    category: "cessione-del-quinto",
    status: "bozza",
    readingMinutes: 5,
    updatedAt: null,
    body: [
      {
        type: "p",
        text: "La cessione del quinto ha una caratteristica che la rende diversa da altri finanziamenti: la rata viene trattenuta prima che lo stipendio o la pensione arrivino sul conto. È comodo, ma proprio per questo vale la pena ragionare con calma prima di decidere.",
      },
      { type: "h2", text: "1. Di quanto ho davvero bisogno?" },
      {
        type: "p",
        text: "Partire dall'importo necessario, e non dal massimo ottenibile, aiuta a contenere il costo totale e a mantenere margine nel bilancio familiare.",
      },
      { type: "h2", text: "2. Quale durata posso sostenere?" },
      {
        type: "p",
        text: "Una durata più lunga abbassa la rata ma aumenta gli interessi complessivi. Conviene confrontare almeno due durate diverse.",
      },
      { type: "h2", text: "3. Ho finanziamenti in corso?" },
      {
        type: "p",
        text: "Altre trattenute o rate incidono sulla quota disponibile e sulla valutazione. Tieni a portata di mano i dati dei finanziamenti attivi.",
      },
      { type: "h2", text: "4. So leggere il TAEG?" },
      {
        type: "p",
        text: "Il TAEG riassume in una percentuale annua il costo complessivo del finanziamento ed è l'indicatore più utile per confrontare proposte con importo e durata simili.",
      },
      { type: "h2", text: "5. Cosa succede se cambia la mia situazione?" },
      {
        type: "p",
        text: "Cambio di lavoro, pensionamento, estinzione anticipata: chiedi sempre come vengono gestiti questi casi nel contratto.",
      },
      {
        type: "callout",
        text: "Queste domande non sostituiscono la consulenza: servono a prepararla. Le risposte dipendono dalla tua situazione e dalle condizioni del finanziatore.",
      },
    ],
  },
  {
    slug: "documenti-per-la-prima-consulenza",
    title: "Cosa preparare per il primo colloquio con un consulente",
    excerpt: "Al primo contatto non servono documenti: bastano poche informazioni. Ecco quali.",
    category: "documenti-e-pratiche",
    status: "bozza",
    readingMinutes: 3,
    updatedAt: null,
    body: [
      {
        type: "p",
        text: "Il primo colloquio serve a capire la tua esigenza. Se li hai già allegati alla richiesta, i documenti aiutano il consulente a prepararsi; in ogni caso avere alcune informazioni a portata di mano rende il confronto più utile.",
      },
      { type: "h2", text: "Informazioni utili" },
      {
        type: "ul",
        items: [
          "Il tipo di contratto di lavoro o l'ente che eroga la pensione",
          "Un'idea dell'importo necessario e della rata sostenibile",
          "Eventuali finanziamenti o trattenute in corso, anche approssimativamente",
          "Le domande che vuoi porre: annotarle prima aiuta a non dimenticarle",
        ],
      },
      { type: "h2", text: "E i documenti?" },
      {
        type: "p",
        text: "Se decidi di proseguire, il consulente ti indica l'elenco preciso e le modalità sicure per l'invio.",
      },
    ],
  },
  {
    slug: "delegazione-di-pagamento-in-breve",
    title: "Delegazione di pagamento: perché serve l'accettazione del datore di lavoro",
    excerpt: "Lo stesso meccanismo della trattenuta in busta paga, con una differenza importante.",
    category: "prestiti",
    status: "bozza",
    readingMinutes: 4,
    updatedAt: null,
    body: [
      {
        type: "p",
        text: "Il prestito per delega si rimborsa con una trattenuta in busta paga, come la cessione del quinto. La differenza è che il datore di lavoro non è tenuto ad accettare la delega.",
      },
      { type: "h2", text: "Cosa significa in pratica" },
      {
        type: "p",
        text: "Prima di avviare la raccolta dei documenti è utile verificare se l'ente o l'azienda accetta deleghe e con quali regole. Così si evitano attese inutili.",
      },
      {
        type: "callout",
        text: "Bozza da integrare con riferimenti normativi verificati e con le prassi dei finanziatori con cui AURFIN opera.",
      },
    ],
  },
];

export function getGuide(slug: string) {
  return guides.find((g) => g.slug === slug) ?? null;
}
