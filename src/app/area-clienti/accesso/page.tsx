import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthLayout, DemoProfiles } from "@/components/app/auth-layout";
import { ClientLinkForm } from "@/components/app/login-panel";
import { Notice } from "@/components/ui/primitives";
import { getViewer } from "@/lib/server/auth";
import { isDemo } from "@/lib/server/env";
import { db } from "@/lib/server/store";

export const metadata: Metadata = { title: "Accesso all'area clienti", robots: { index: false } };

export default async function ClientLoginPage({ searchParams }: PageProps<"/area-clienti/accesso">) {
  if (await getViewer("cliente")) redirect("/area-clienti");
  const { link } = await searchParams;
  return (
    <AuthLayout
      title="Accedi all'area clienti"
      intro="Nessuna password da ricordare: inserisci l'email usata per la richiesta e ti inviamo un link di accesso."
      demo={isDemo}
    >
      {link === "scaduto" ? (
        <Notice tone="warning" role="alert" className="mb-5">
          Il link non è più valido: è scaduto oppure è già stato usato. Richiedine uno nuovo.
        </Notice>
      ) : null}
      <ClientLinkForm />
      {isDemo ? <DemoProfiles users={db.users.filter((u) => u.role === "cliente" && u.email.endsWith(".invalid"))} area="cliente" /> : null}
    </AuthLayout>
  );
}
