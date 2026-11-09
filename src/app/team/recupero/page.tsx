import type { Metadata } from "next";
import Link from "next/link";
import { AuthLayout } from "@/components/app/auth-layout";
import { RecoveryForm } from "@/components/app/login-panel";
import { isDemo } from "@/lib/server/env";

export const metadata: Metadata = { title: "Recupero credenziali" };

export default function TeamRecoveryPage() {
  return (
    <AuthLayout
      title="Recupera le credenziali"
      intro="Primo accesso o password dimenticata: inserisci l'email aziendale e riceverai un link per impostare la password."
      demo={isDemo}
      variant="team"
    >
      <RecoveryForm />
      <p className="mt-8 text-sm text-slate">
        <Link href="/team/accesso" className="font-medium text-teal-700 underline underline-offset-2">
          Torna all&apos;accesso
        </Link>
      </p>
    </AuthLayout>
  );
}
