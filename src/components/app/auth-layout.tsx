import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { DemoBanner, TeamTag } from "@/components/app/app-shell";
import { DiagonalMotif } from "@/components/content/blocks";
import { ROLES } from "@/lib/domain";
import { demoLogin } from "@/lib/server/auth-actions";
import type { User } from "@/lib/server/store";
import { cn } from "@/lib/utils";

/** Pagina di accesso: l'area clienti e lo spazio team hanno ingressi e aspetto distinti. */
export function AuthLayout({
  title,
  intro,
  demo,
  variant = "cliente",
  children,
}: {
  title: string;
  intro: string;
  demo: boolean;
  variant?: "cliente" | "team";
  children: React.ReactNode;
}) {
  const team = variant === "team";
  const home = team ? "/team/accesso" : "/";
  return (
    <div className="flex min-h-dvh flex-col bg-ivory">
      {demo ? <DemoBanner /> : null}
      <div className="grid flex-1 lg:grid-cols-[1fr_1.1fr]">
        <div
          className={cn(
            "relative hidden overflow-hidden p-12 text-ivory lg:flex lg:flex-col lg:justify-between",
            team ? "bg-navy-950" : "bg-navy-900",
          )}
        >
          <DiagonalMotif className="pointer-events-none absolute -right-24 -bottom-16 h-[30rem] text-white/[0.05]" />
          <Link href={home} aria-label={team ? "AURFIN Team" : "AURFIN, torna al sito"} className="flex items-center gap-3">
            <Logo inverse />
            {team ? <TeamTag /> : null}
          </Link>
          <p className="relative max-w-md font-serif text-3xl leading-snug">
            {team
              ? "Richieste, pratiche, documenti e appuntamenti del team, in un unico spazio di lavoro."
              : "Segui la tua richiesta, i documenti e gli appuntamenti in un unico posto."}
          </p>
          <p className="relative text-sm text-ivory/60">{team ? "Spazio riservato al personale AURFIN" : "Area clienti AURFIN"}</p>
        </div>
        <main id="contenuto" className="flex items-center justify-center px-4 py-12 sm:px-8">
          <div className="w-full max-w-md">
            <Link href={home} className="mb-10 inline-flex items-center gap-3 lg:hidden" aria-label={team ? "AURFIN Team" : "AURFIN, torna al sito"}>
              <Logo />
              {team ? <TeamTag light /> : null}
            </Link>
            <h1 className="font-serif text-3xl text-navy-900 sm:text-4xl">{title}</h1>
            <p className="mt-3 text-slate">{intro}</p>
            <div className="mt-8">{children}</div>
          </div>
        </main>
      </div>
    </div>
  );
}

export function DemoProfiles({ users, area }: { users: User[]; area: "cliente" | "staff" }) {
  return (
    <section aria-labelledby="demo-profili" className="mt-10 rounded-lg border border-brass/60 bg-white p-5">
      <h2 id="demo-profili" className="text-sm font-bold tracking-wider text-brass-700 uppercase">
        Profili dimostrativi
      </h2>
      <p className="mt-2 text-sm text-slate">Accesso senza password, solo in questo ambiente. Dati sintetici.</p>
      <ul className="mt-4 space-y-2">
        {users.map((u) => (
          <li key={u.id}>
            <form action={demoLogin}>
              <input type="hidden" name="uid" value={u.id} />
              <input type="hidden" name="area" value={area} />
              <button
                type="submit"
                className="flex min-h-12 w-full items-center justify-between gap-3 rounded-md border border-line px-4 py-2 text-left transition-colors hover:border-navy-900 hover:bg-ivory"
              >
                <span>
                  <span className="block font-medium text-navy-900">{u.name}</span>
                  <span className="block text-sm text-slate">{ROLES[u.role]}</span>
                </span>
                <span className="text-sm font-medium text-teal-700">Entra →</span>
              </button>
            </form>
          </li>
        ))}
      </ul>
    </section>
  );
}
