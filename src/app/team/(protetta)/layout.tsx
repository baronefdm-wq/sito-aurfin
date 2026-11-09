import { AppShell } from "@/components/app/app-shell";
import { STAFF_ROLES, requireRole } from "@/lib/server/auth";
import { isDemo } from "@/lib/server/env";

export default async function TeamLayout({ children }: { children: React.ReactNode }) {
  const viewer = await requireRole(STAFF_ROLES, "/team/accesso");
  const nav = [
    { href: "/team", label: "Richieste e pratiche", exact: true },
    { href: "/team/planner", label: "Planner" },
    { href: "/team/appuntamenti", label: "Appuntamenti" },
    { href: "/team/rinnovi", label: "Rinnovi" },
    { href: "/team/cruscotto", label: "Cruscotto" },
    ...(viewer.role === "amministratore"
      ? [
          { href: "/team/utenti", label: "Utenti" },
          { href: "/team/notifiche", label: "Notifiche e impostazioni" },
          { href: "/team/configurazione", label: "Pubblicazione e integrazioni" },
        ]
      : []),
  ];
  return (
    <AppShell title="Spazio team" user={viewer} nav={nav} demo={isDemo} space="team">
      {children}
    </AppShell>
  );
}
