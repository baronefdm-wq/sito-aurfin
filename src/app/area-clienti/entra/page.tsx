import type { Metadata } from "next";
import { AuthLayout } from "@/components/app/auth-layout";
import { Button } from "@/components/ui/button";
import { enterClientArea } from "@/lib/server/auth-actions";
import { isDemo } from "@/lib/server/env";

export const metadata: Metadata = { title: "Entra nell'area clienti", robots: { index: false, follow: false } };

/**
 * Serve un clic esplicito: i sistemi antispam aprono i link delle email in
 * automatico e, senza questo passaggio, consumerebbero il link monouso.
 */
export default async function EnterPage({ searchParams }: PageProps<"/area-clienti/entra">) {
  const { token } = await searchParams;
  return (
    <AuthLayout title="Entra nell'area clienti" intro="Conferma per accedere alla tua richiesta." demo={isDemo}>
      <form action={enterClientArea}>
        <input type="hidden" name="token" value={typeof token === "string" ? token : ""} />
        <Button type="submit" size="lg">
          Entra
        </Button>
      </form>
    </AuthLayout>
  );
}
