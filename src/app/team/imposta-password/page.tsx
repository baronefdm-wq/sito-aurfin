import type { Metadata } from "next";
import Link from "next/link";
import { AuthLayout } from "@/components/app/auth-layout";
import { SetPasswordForm } from "@/components/app/login-panel";
import { Notice } from "@/components/ui/primitives";
import { isDemo } from "@/lib/server/env";
import { isTokenValid } from "@/lib/server/tokens";

export const metadata: Metadata = { title: "Imposta la password" };

export default async function SetPasswordPage({ searchParams }: PageProps<"/team/imposta-password">) {
  const { token } = await searchParams;
  const value = typeof token === "string" ? token : "";
  return (
    <AuthLayout title="Imposta la password" intro="Scegli la password per lo spazio team." demo={isDemo} variant="team">
      {isTokenValid(value, "password") ? (
        <SetPasswordForm token={value} />
      ) : (
        <Notice tone="warning" role="alert">
          Il link non è più valido.{" "}
          <Link href="/team/recupero" className="font-medium underline">
            Richiedine uno nuovo
          </Link>
          .
        </Notice>
      )}
    </AuthLayout>
  );
}
