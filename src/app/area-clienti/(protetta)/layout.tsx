import type { Metadata } from "next";
import { AppShell } from "@/components/app/app-shell";
import { requireRole } from "@/lib/server/auth";
import { isDemo } from "@/lib/server/env";

export const metadata: Metadata = { title: "Area clienti", robots: { index: false, follow: false } };

export default async function ClientAreaLayout({ children }: { children: React.ReactNode }) {
  const viewer = await requireRole(["cliente"], "/area-clienti/accesso");
  return (
    <AppShell
      title="Area clienti"
      user={viewer}
      demo={isDemo}
      space="cliente"
      nav={[
        { href: "/area-clienti", label: "La mia richiesta", exact: true },
        { href: "/area-clienti/documenti", label: "Documenti" },
        { href: "/area-clienti/appuntamenti", label: "Appuntamenti" },
        { href: "/area-clienti/profilo", label: "Profilo e preferenze" },
      ]}
    >
      {children}
    </AppShell>
  );
}
