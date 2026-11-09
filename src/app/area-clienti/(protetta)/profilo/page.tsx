import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Card, PageTitle } from "@/components/app/app-shell";
import { Button } from "@/components/ui/button";
import { Notice } from "@/components/ui/primitives";
import { assertRole, requireRole } from "@/lib/server/auth";
import { updateClientPreferences } from "@/lib/server/repository";

export const metadata = { title: "Profilo e preferenze" };

async function savePreferences(formData: FormData) {
  "use server";
  const viewer = await assertRole(["cliente"]);
  const contact = formData.get("contact") === "telefono" ? "telefono" : "email";
  updateClientPreferences(viewer, {
    contact,
    marketing: formData.get("marketing") === "on",
    reminders: formData.get("reminders") === "on",
  });
  revalidatePath("/area-clienti/profilo");
  redirect("/area-clienti/profilo?salvato=1");
}

export default async function ProfilePage({ searchParams }: PageProps<"/area-clienti/profilo">) {
  const viewer = await requireRole(["cliente"], "/area-clienti/accesso");
  const { salvato } = await searchParams;
  const prefs = viewer.preferences ?? { contact: "email", marketing: false, reminders: true };

  return (
    <>
      <PageTitle title="Profilo e preferenze" />
      {salvato ? (
        <Notice tone="success" role="status" className="mb-6">
          Preferenze salvate.
        </Notice>
      ) : null}
      <div className="grid gap-6 xl:grid-cols-2">
        <Card title="Dati del profilo">
          <dl className="space-y-4">
            <div>
              <dt className="text-sm text-slate">Nome e cognome</dt>
              <dd className="text-navy-900">{viewer.name}</dd>
            </div>
            <div>
              <dt className="text-sm text-slate">Email</dt>
              <dd className="break-all text-navy-900">{viewer.email}</dd>
            </div>
            <div>
              <dt className="text-sm text-slate">Telefono</dt>
              <dd className="text-navy-900">{viewer.phone ?? "—"}</dd>
            </div>
          </dl>
          <p className="mt-5 text-sm text-slate">Per modificare questi dati contatta il tuo consulente.</p>
        </Card>

        <Card title="Preferenze di contatto">
          <form action={savePreferences} className="space-y-6">
            <fieldset>
              <legend className="font-medium text-navy-900">Canale preferito</legend>
              <div className="mt-3 flex flex-wrap gap-4">
                {[
                  ["email", "Email"],
                  ["telefono", "Telefono"],
                ].map(([v, l]) => (
                  <label key={v} className="flex min-h-11 cursor-pointer items-center gap-2.5">
                    <input type="radio" name="contact" value={v} defaultChecked={prefs.contact === v} className="size-4 accent-navy-900" />
                    {l}
                  </label>
                ))}
              </div>
            </fieldset>
            <label className="flex cursor-pointer items-start gap-3">
              <input type="checkbox" name="reminders" defaultChecked={prefs.reminders} className="mt-1 size-5 accent-navy-900" />
              <span>
                <span className="block text-navy-900">Promemoria degli appuntamenti</span>
                <span className="block text-sm text-slate">Richiede il servizio di invio email, non ancora collegato.</span>
              </span>
            </label>
            <label className="flex cursor-pointer items-start gap-3">
              <input type="checkbox" name="marketing" defaultChecked={prefs.marketing} className="mt-1 size-5 accent-navy-900" />
              <span>
                <span className="block text-navy-900">Comunicazioni commerciali</span>
                <span className="block text-sm text-slate">Facoltativo, revocabile in qualsiasi momento.</span>
              </span>
            </label>
            <Button type="submit">Salva le preferenze</Button>
          </form>
        </Card>
      </div>
    </>
  );
}
