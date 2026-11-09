export type NavItem = { href: string; label: string; description?: string };

export const solutions: NavItem[] = [
  {
    href: "/cessione-del-quinto",
    label: "Cessione del quinto",
    description: "Rimborso con trattenuta diretta su stipendio o pensione.",
  },
  {
    href: "/prestito-delega",
    label: "Prestito per delega",
    description: "Per lavoratori dipendenti, previa accettazione del datore di lavoro.",
  },
  {
    href: "/prestiti-personali",
    label: "Prestiti personali",
    description: "Rimborso a rate per progetti ed esigenze personali.",
  },
];

export const mainNav: NavItem[] = [
  { href: "/come-funziona", label: "Come funziona" },
  { href: "/chi-siamo", label: "Chi siamo" },
  { href: "/guide", label: "Guide" },
  { href: "/faq", label: "FAQ" },
  { href: "/contatti", label: "Contatti" },
];

export const legalNav: NavItem[] = [
  { href: "/privacy", label: "Informativa privacy" },
  { href: "/cookie", label: "Cookie" },
  { href: "/trasparenza", label: "Trasparenza" },
  { href: "/informativa-intermediario", label: "Informativa sull'intermediario" },
  { href: "/reclami", label: "Reclami" },
  { href: "/accessibilita", label: "Accessibilità" },
  { href: "/informazioni-societarie", label: "Informazioni societarie" },
];
