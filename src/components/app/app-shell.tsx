import Link from "next/link";
import { LogOut } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { AppNav, type AppNavItem } from "@/components/app/app-nav";
import { Button } from "@/components/ui/button";
import { ROLES, type Role } from "@/lib/domain";
import { logoutClient, logoutTeam } from "@/lib/server/auth-actions";
import { cn } from "@/lib/utils";

export function TeamTag({ light = false }: { light?: boolean }) {
  return (
    <span
      className={cn(
        "rounded-sm px-1.5 py-0.5 text-[0.6875rem] font-bold tracking-[0.14em] uppercase",
        light ? "bg-teal-700 text-white" : "bg-brass text-navy-950",
      )}
    >
      Team
    </span>
  );
}

export function DemoBanner() {
  return (
    <div role="note" className="bg-brass px-4 py-2 text-center text-[0.8125rem] font-medium text-navy-950">
      Ambiente dimostrativo · Dati sintetici, nessuna persona reale
    </div>
  );
}

/**
 * Struttura comune ai due spazi riservati, con identità distinte:
 * area clienti (chiara, collegata al sito) e spazio team (barra scura, nessun
 * collegamento al sito pubblico né all'area clienti).
 */
export function AppShell({
  title,
  user,
  nav,
  demo,
  space,
  children,
}: {
  title: string;
  user: { name: string; role: Role };
  nav: AppNavItem[];
  demo: boolean;
  space: "cliente" | "team";
  children: React.ReactNode;
}) {
  const team = space === "team";
  return (
    <div className="flex min-h-dvh flex-col bg-ivory">
      {demo ? <DemoBanner /> : null}
      <header className={cn("border-b", team ? "border-navy-800 bg-navy-950 text-ivory" : "border-line bg-paper")}>
        <div className="mx-auto flex h-16 w-full max-w-[90rem] items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-4">
            <Link
              href={team ? "/team" : "/"}
              aria-label={team ? "AURFIN Team, vai alla home dello spazio team" : "AURFIN, vai al sito"}
              className="flex shrink-0 items-center gap-2.5"
            >
              <Logo inverse={team} />
              {team ? <TeamTag /> : null}
            </Link>
            <span aria-hidden className={cn("hidden h-6 w-px sm:block", team ? "bg-ivory/20" : "bg-line-strong")} />
            <span className={cn("hidden truncate text-[0.9375rem] font-medium sm:block", team ? "text-ivory/85" : "text-navy-900")}>
              {title}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden text-right leading-tight sm:block">
              <p className={cn("text-sm font-medium", team ? "text-ivory" : "text-navy-900")}>{user.name}</p>
              <p className={cn("text-xs", team ? "text-ivory/60" : "text-slate")}>{ROLES[user.role]}</p>
            </div>
            <form action={team ? logoutTeam : logoutClient}>
              <Button type="submit" variant={team ? "inverse-outline" : "secondary"} size="sm">
                <LogOut aria-hidden />
                <span className="max-[400px]:sr-only">Esci</span>
              </Button>
            </form>
          </div>
        </div>
      </header>
      <div className="mx-auto grid w-full max-w-[90rem] flex-1 gap-0 lg:grid-cols-[15rem_1fr]">
        <AppNav items={nav} label={title} />
        <main id="contenuto" tabIndex={-1} className="min-w-0 px-4 py-8 focus:outline-none sm:px-6 lg:px-10 lg:py-10">
          {children}
        </main>
      </div>
    </div>
  );
}

export function PageTitle({ title, description, actions }: { title: string; description?: string; actions?: React.ReactNode }) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="font-serif text-3xl text-navy-900 sm:text-4xl">{title}</h1>
        {description ? <p className="mt-2 max-w-2xl text-slate">{description}</p> : null}
      </div>
      {actions}
    </div>
  );
}

export function Card({ title, children, className, action }: { title?: string; children: React.ReactNode; className?: string; action?: React.ReactNode }) {
  return (
    <section className={`rounded-lg border border-line bg-white ${className ?? ""}`} aria-label={title}>
      {title ? (
        <div className="flex items-center justify-between gap-4 border-b border-line px-5 py-4">
          <h2 className="font-semibold text-navy-900">{title}</h2>
          {action}
        </div>
      ) : null}
      <div className="p-5">{children}</div>
    </section>
  );
}

export function EmptyState({ title, text }: { title: string; text?: string }) {
  return (
    <div className="rounded-md border border-dashed border-line-strong px-5 py-8 text-center">
      <p className="font-medium text-navy-900">{title}</p>
      {text ? <p className="mt-1 text-sm text-slate">{text}</p> : null}
    </div>
  );
}
