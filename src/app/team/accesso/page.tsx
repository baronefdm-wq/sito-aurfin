import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthLayout, DemoProfiles } from "@/components/app/auth-layout";
import { CredentialsForm } from "@/components/app/login-panel";
import { Notice } from "@/components/ui/primitives";
import { getViewer } from "@/lib/server/auth";
import { isDemo } from "@/lib/server/env";
import { db } from "@/lib/server/store";

export const metadata: Metadata = { title: "Accesso" };

export default async function TeamLoginPage({ searchParams }: PageProps<"/team/accesso">) {
  if (await getViewer("team")) redirect("/team");
  const { password } = await searchParams;
  return (
    <AuthLayout title="Spazio team" intro="Accesso riservato al personale AURFIN, con password e codice via email." demo={isDemo} variant="team">
      {password === "impostata" ? (
        <Notice tone="success" role="status" className="mb-5">
          Password impostata. Ora puoi accedere.
        </Notice>
      ) : null}
      <CredentialsForm recoveryHref="/team/recupero" />
      {isDemo ? <DemoProfiles users={db.users.filter((u) => u.role !== "cliente" && u.email.endsWith(".invalid"))} area="staff" /> : null}
    </AuthLayout>
  );
}
