import Link from "next/link";
import { CheckCircle2, CircleDashed, Mail, MessageCircle, TriangleAlert } from "lucide-react";
import { Card, EmptyState, PageTitle } from "@/components/app/app-shell";
import { Button } from "@/components/ui/button";
import { Badge, Notice } from "@/components/ui/primitives";
import { maintenanceNow, sendTestNotification, updateSettings } from "@/app/team/actions";
import { firstContactHours, retentionDays } from "@/lib/server/jobs";
import { db } from "@/lib/server/store";
import { requireRole } from "@/lib/server/auth";
import { channelStatus, listNotifications } from "@/lib/server/notifications";
import { formatDateTime } from "@/lib/utils";

export const metadata = { title: "Notifiche e impostazioni" };

const EVENTS = [
  ["Nuova richiesta di preventivo", "Soluzione, situazione lavorativa, importo e durata, preferenza di ricontatto"],
  ["Nuova telefonata prenotata", "Giorno, ora e argomento della telefonata"],
  ["Proposta disponibile", "Quando una pratica passa allo stato «Proposta disponibile»"],
  ["Documento caricato dal cliente", "Dall'area clienti"],
  ["Sollecito primo contatto", "Richieste ancora senza primo contatto oltre il tempo previsto"],
  ["Finanziamento rinnovabile", "Quando viene raggiunta la data stimata di rinnovo"],
];

export default async function NotificationsPage() {
  await requireRole(["amministratore"], "/team/accesso");
  const status = channelStatus();
  const log = listNotifications();
  const anyConfigured = status.email.configured || status.whatsapp.configured;

  const channels = [
    { key: "email", label: "Email", icon: Mail, ...status.email, env: "NOTIFY_EMAIL_TO, SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM" },
    {
      key: "whatsapp",
      label: "WhatsApp",
      icon: MessageCircle,
      ...status.whatsapp,
      env: "NOTIFY_WHATSAPP_TO, WHATSAPP_TOKEN, WHATSAPP_PHONE_NUMBER_ID, WHATSAPP_TEMPLATE",
    },
  ];

  return (
    <>
      <PageTitle
        title="Notifiche e impostazioni"
        description="Avvisi al team, email ai clienti e regole di assegnazione."
        actions={
          <form action={sendTestNotification}>
            <Button type="submit" variant="secondary">
              Invia una notifica di prova
            </Button>
          </form>
        }
      />

      {!anyConfigured ? (
        <Notice tone="warning" title="Nessun canale configurato" className="mb-6">
          Gli eventi vengono registrati qui sotto ma non inviati. Per attivare email e WhatsApp inserisci le credenziali in{" "}
          <code className="rounded bg-white/70 px-1">.env.local</code> e riavvia l&apos;app: le istruzioni sono nel README.
        </Notice>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-2">
        {channels.map((c) => (
          <Card
            key={c.key}
            title={c.label}
            action={c.configured ? <Badge tone="teal">Attivo</Badge> : <Badge tone="muted">Non configurato</Badge>}
          >
            <div className="flex gap-3">
              <c.icon aria-hidden className="mt-0.5 size-5 shrink-0 text-navy-700" />
              {c.configured ? (
                <p className="text-navy-900">Destinatari: {c.recipients.join(", ")}</p>
              ) : (
                <p className="text-sm text-slate">
                  Variabili richieste: <code className="break-all">{c.env}</code>
                  {c.key === "whatsapp"
                    ? ". Serve un account WhatsApp Business (Meta) con un modello di messaggio approvato."
                    : "."}
                </p>
              )}
            </div>
          </Card>
        ))}
      </div>

      <Card title="Impostazioni" className="mt-6">
        <form action={updateSettings} className="space-y-4">
          <label className="flex cursor-pointer items-start gap-3">
            <input type="checkbox" name="clientEmails" defaultChecked={db.settings.clientEmails} className="mt-1 size-5 accent-navy-900" />
            <span>
              <span className="block font-medium text-navy-900">Email ai clienti</span>
              <span className="block text-sm text-slate">Conferma di ricezione, aggiornamenti di stato e documenti richiesti. Contengono solo codice e stato, mai importi o documenti.</span>
            </span>
          </label>
          <label className="flex cursor-pointer items-start gap-3">
            <input type="checkbox" name="autoAssign" defaultChecked={db.settings.autoAssign} className="mt-1 size-5 accent-navy-900" />
            <span>
              <span className="block font-medium text-navy-900">Assegnazione automatica</span>
              <span className="block text-sm text-slate">Ogni nuova richiesta va al consulente attivo con meno pratiche aperte.</span>
            </span>
          </label>
          <Button type="submit" size="sm">
            Salva le impostazioni
          </Button>
        </form>
        <div className="mt-5 border-t border-line pt-4 text-sm text-slate">
          <p>Sollecito del primo contatto dopo {firstContactHours()} ore (FIRST_CONTACT_ALERT_HOURS).</p>
          <p className="mt-1">
            {retentionDays()
              ? `I documenti delle pratiche chiuse vengono eliminati dopo ${retentionDays()} giorni (DOCUMENT_RETENTION_DAYS).`
              : "Cancellazione automatica dei documenti non attiva: va impostata DOCUMENT_RETENTION_DAYS con il periodo deciso dal consulente privacy."}
          </p>
          <form action={maintenanceNow} className="mt-3">
            <Button type="submit" size="sm" variant="secondary">
              Esegui ora solleciti e cancellazioni
            </Button>
          </form>
        </div>
      </Card>

      <Card title="Eventi notificati al team" className="mt-6">
        <ul className="divide-y divide-line">
          {EVENTS.map(([title, detail]) => (
            <li key={title} className="py-2.5 first:pt-0 last:pb-0">
              <p className="font-medium text-navy-900">{title}</p>
              <p className="text-sm text-slate">{detail}</p>
            </li>
          ))}
        </ul>
        <p className="mt-4 border-t border-line pt-4 text-sm text-slate">
          Per riservatezza WhatsApp riceve solo tipo di evento, codice e link allo spazio team; l&apos;email aggiunge il nome del
          richiedente. Documenti, recapiti e testi dei messaggi restano nello spazio team.
        </p>
      </Card>

      <Card title="Registro degli invii" className="mt-6" action={<span className="text-xs text-slate">Ultimi {log.length}</span>}>
        {log.length === 0 ? (
          <EmptyState title="Nessuna notifica ancora" text="Invia una richiesta dal sito o usa «Invia una notifica di prova»." />
        ) : (
          <ul className="divide-y divide-line">
            {log.slice(0, 60).map((n) => (
              <li key={n.id} className="flex gap-3 py-3 first:pt-0 last:pb-0">
                {n.status === "inviata" ? (
                  <CheckCircle2 aria-hidden className="mt-0.5 size-5 shrink-0 text-teal-700" />
                ) : n.status === "errore" ? (
                  <TriangleAlert aria-hidden className="mt-0.5 size-5 shrink-0 text-danger" />
                ) : (
                  <CircleDashed aria-hidden className="mt-0.5 size-5 shrink-0 text-slate" />
                )}
                <div className="min-w-0">
                  <p className="text-navy-900">
                    <span className="font-medium">{n.title}</span> · {n.channel === "email" ? "Email" : "WhatsApp"}
                    {n.recipient !== "—" ? ` a ${n.recipient}` : ""}
                  </p>
                  <p className="text-sm text-slate">
                    {formatDateTime(n.at)} ·{" "}
                    {n.status === "inviata"
                      ? "Inviata"
                      : n.status === "errore"
                        ? `Errore: ${n.detail}`
                        : n.status === "disattivata"
                          ? `Non inviata: ${n.detail}`
                          : "Non inviata: canale non configurato"}
                    {n.requestId ? (
                      <>
                        {" · "}
                        <Link href={`/team/pratiche/${n.requestId}`} className="text-teal-700 hover:underline">
                          Apri la pratica
                        </Link>
                      </>
                    ) : null}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
