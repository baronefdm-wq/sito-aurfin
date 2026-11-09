import { Card, PageTitle } from "@/components/app/app-shell";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/form-controls";
import { Badge, Notice } from "@/components/ui/primitives";
import { addStaffUser, setStaffActive } from "@/app/team/actions";
import { ROLES } from "@/lib/domain";
import { requireRole } from "@/lib/server/auth";
import { isMailReady } from "@/lib/server/notifications";
import { listStaff } from "@/lib/server/store";
import { formatDateTime } from "@/lib/utils";

export const metadata = { title: "Utenti del team" };

export default async function UsersPage() {
  const viewer = await requireRole(["amministratore"], "/team/accesso");
  const users = listStaff();

  return (
    <>
      <PageTitle title="Utenti del team" description="Chi può accedere allo spazio team e con quale ruolo." />
      {!isMailReady() ? (
        <Notice tone="warning" className="mb-6">
          L&apos;invio email non è configurato: gli inviti e i codici di accesso non possono partire.
        </Notice>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <Card title={`Utenti (${users.length})`}>
          <ul className="divide-y divide-line">
            {users.map((u) => (
              <li key={u.id} className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                <div className="min-w-0">
                  <p className="font-medium text-navy-900">{u.name}</p>
                  <p className="break-all text-sm text-slate">{u.email}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5">
                    <Badge>{ROLES[u.role]}</Badge>
                    {u.active === false ? <Badge tone="danger">Disattivato</Badge> : null}
                    {!u.passwordHash ? <Badge tone="muted">Password non impostata</Badge> : null}
                    {u.lastLoginAt ? <span className="text-xs text-slate">Ultimo accesso: {formatDateTime(u.lastLoginAt)}</span> : null}
                  </div>
                </div>
                {u.id !== viewer.id ? (
                  <form action={setStaffActive}>
                    <input type="hidden" name="userId" value={u.id} />
                    <input type="hidden" name="active" value={u.active === false ? "true" : "false"} />
                    <Button type="submit" size="sm" variant="secondary">
                      {u.active === false ? "Riattiva" : "Disattiva"}
                    </Button>
                  </form>
                ) : null}
              </li>
            ))}
          </ul>
        </Card>

        <Card title="Aggiungi un utente">
          <form action={addStaffUser} className="space-y-4">
            <div>
              <Label htmlFor="user-name">Nome e cognome</Label>
              <Input id="user-name" name="name" required minLength={3} maxLength={120} className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="user-email">Email aziendale</Label>
              <Input id="user-email" name="email" type="email" required maxLength={120} className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="user-role">Ruolo</Label>
              <Select id="user-role" name="role" defaultValue="consulente" className="mt-1.5">
                <option value="consulente">Consulente</option>
                <option value="amministratore">Amministratore</option>
              </Select>
            </div>
            <Button type="submit">Aggiungi e invia l&apos;invito</Button>
            <p className="text-sm text-slate">Riceverà un link per impostare la password, valido per un&apos;ora.</p>
          </form>
        </Card>
      </div>
    </>
  );
}
