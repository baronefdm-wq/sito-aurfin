import { FileText } from "lucide-react";
import { Card, EmptyState, PageTitle } from "@/components/app/app-shell";
import { ClientUpload } from "@/components/app/client-upload";
import { DocumentBadge } from "@/components/app/status";
import { Notice } from "@/components/ui/primitives";
import { DOCUMENT_RULES, formatBytes } from "@/lib/documents";
import { requireRole } from "@/lib/server/auth";
import { isDemo } from "@/lib/server/env";
import { getClientOverview } from "@/lib/server/repository";
import { isStorageConfigured } from "@/lib/server/storage";
import { formatDateTime } from "@/lib/utils";

export const metadata = { title: "Documenti" };

export default async function ClientDocumentsPage() {
  const viewer = await requireRole(["cliente"], "/area-clienti/accesso");
  const overview = getClientOverview(viewer);
  const docs = overview?.documents ?? [];
  const uploads = isStorageConfigured();

  return (
    <>
      <PageTitle title="Documenti" description="I documenti richiesti per la tua pratica: puoi caricarli qui in qualsiasi momento." />

      {!uploads ? (
        <Notice tone="warning" title="Caricamento dei documenti non attivo" className="mb-6">
          Lo storage privato non è configurato: il consulente ti indicherà un canale sicuro per l&apos;invio.
        </Notice>
      ) : isDemo ? (
        <Notice tone="demo" title="Ambiente dimostrativo" className="mb-6">
          I file vengono salvati in un archivio privato su questo computer. Per le prove usa documenti di esempio.
        </Notice>
      ) : null}

      <Card title="Documenti richiesti">
        {docs.length === 0 ? (
          <EmptyState title="Nessun documento richiesto al momento" text="Il consulente ti indicherà i documenti necessari." />
        ) : (
          <ul className="divide-y divide-line">
            {docs.map((d) => (
              <li key={d.id} className="py-4 first:pt-0 last:pb-0">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-navy-900">{d.label}</p>
                      <DocumentBadge status={d.status} />
                    </div>
                    <p className="text-sm text-slate">{d.description}</p>
                    {d.files.length ? (
                      <ul className="mt-2 space-y-1">
                        {d.files.map((f) => (
                          <li key={f.id} className="flex items-center gap-2 text-sm">
                            <FileText aria-hidden className="size-4 shrink-0 text-teal-700" />
                            <a href={`/api/documenti/${f.id}`} target="_blank" rel="noopener" className="truncate text-teal-700 hover:underline">
                              {f.name}
                            </a>
                            <span className="shrink-0 text-slate">
                              {formatBytes(f.size)} · {formatDateTime(f.uploadedAt)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                  {uploads && d.status !== "verificato" ? (
                    <ClientUpload
                      documentId={d.id}
                      label={d.label}
                      disabled={d.files.length >= DOCUMENT_RULES.maxFilesPerSlot}
                    />
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-6 border-t border-line pt-4 text-sm text-slate">
          Formati ammessi: PDF, JPG, PNG, fino a {DOCUMENT_RULES.maxBytes / 1024 / 1024} MB per file e{" "}
          {DOCUMENT_RULES.maxFilesPerSlot} file per documento. I file sono conservati in un archivio privato e consultabili
          solo da te e dal personale autorizzato.
        </p>
      </Card>
    </>
  );
}
