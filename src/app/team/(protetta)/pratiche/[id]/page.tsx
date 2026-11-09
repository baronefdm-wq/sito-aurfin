import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, FileText, Lock, Mail, MessageCircle, Phone } from "lucide-react";
import { ConfirmButton } from "@/components/app/confirm-button";
import { QuoteReply } from "@/components/app/quote-reply";
import { quoteDraft } from "@/lib/quote-reply";
import { BOOKING_LINK_DAYS, bookingUrl } from "@/lib/server/booking-link";
import { documentProgress, internationalPhone, isClosed, nextStep, prequalHints } from "@/lib/case-summary";
import { SLOT_TIMES, formatAppointment } from "@/lib/scheduling";
import { renewableAt } from "@/lib/server/repository";
import { formatBytes } from "@/lib/documents";
import { Card, EmptyState } from "@/components/app/app-shell";
import { AppointmentBadge, DocumentBadge, StatusBadge } from "@/components/app/status";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/form-controls";
import { Badge, Notice } from "@/components/ui/primitives";
import {
  AGE_BANDS,
  APPOINTMENT_STATUSES,
  CONTRACT_TYPES,
  EMPLOYER_SIZES,
  EXISTING_LOANS,
  INCOME_BANDS,
  SENIORITY_BANDS,
  CONTACT_PREFERENCES,
  CONTACT_TOPICS,
  DOCUMENT_STATUSES,
  MEETING_MODES,
  REQUEST_KINDS,
  SOLUTIONS,
  STATUSES,
  TIME_SLOTS,
  WEEKDAYS,
  WORK_CATEGORIES,
  type AppointmentStatus,
  type DocumentStatus,
  type RequestStatus,
} from "@/lib/domain";
import { AuthorizationError, STAFF_ROLES, requireRole } from "@/lib/server/auth";
import { getRequestForStaff } from "@/lib/server/repository";
import { getUser, listConsultants } from "@/lib/server/store";
import { formatDateTime, formatEuro, formatMonths } from "@/lib/utils";
import {
  addNote,
  assign,
  changeStatus,
  removeAttachment,
  requestDocument,
  saveContract,
  scheduleAppointment,
  setAppointmentStatus,
  setDocumentStatus,
  takeOver,
} from "@/app/team/actions";

export const metadata = { title: "Dettaglio pratica" };

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-0.5 py-2.5 sm:grid-cols-[11rem_1fr] sm:gap-4">
      <dt className="text-sm text-slate">{label}</dt>
      <dd className="break-words text-navy-900">{children}</dd>
    </div>
  );
}

export default async function RequestDetail({ params, searchParams }: PageProps<"/team/pratiche/[id]">) {
  const viewer = await requireRole(STAFF_ROLES, "/team/accesso");
  const { id } = await params;
  const { errore } = await searchParams;

  let data;
  try {
    data = getRequestForStaff(viewer, id);
  } catch (e) {
    if (e instanceof AuthorizationError) notFound();
    throw e;
  }
  const { request: r, appointments, permissions } = data;
  const assignee = r.assigneeId ? getUser(r.assigneeId) : null;
  const notes = [...r.notes].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const history = [...r.history].sort((a, b) => b.at.localeCompare(a.at));
  const docs = documentProgress(r);
  const hints = prequalHints(r);
  const isAdmin = viewer.role === "amministratore";

  return (
    <>
      <Link href="/team" className="mb-6 inline-flex min-h-10 items-center gap-2 text-sm font-medium text-teal-700 hover:underline">
        <ArrowLeft aria-hidden className="size-4" /> Torna all&apos;elenco
      </Link>

      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-slate tabular-nums">
            {r.reference} · {REQUEST_KINDS[r.kind]}
            {r.synthetic ? " · dati sintetici" : ""}
          </p>
          <h1 className="mt-1 font-serif text-3xl text-navy-900 sm:text-4xl">{r.contact.fullName}</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={r.status} />
          {assignee ? <Badge>Consulente: {assignee.name}</Badge> : <Badge tone="brass">Da assegnare</Badge>}
        </div>
      </div>

      {/* Situazione della pratica: tutto ciò che serve a colpo d'occhio */}
      <section aria-labelledby="situazione-titolo" className="mb-6 overflow-hidden rounded-lg border border-line bg-white">
        <h2 id="situazione-titolo" className="sr-only">Situazione della pratica</h2>
        <dl className="grid grid-cols-2 gap-px bg-line sm:grid-cols-3 xl:grid-cols-6">
          {[
            ["Soluzione", r.solution ? SOLUTIONS[r.solution] : REQUEST_KINDS[r.kind]],
            ["Importo", r.amount ? formatEuro(r.amount) : "—"],
            ["Durata", r.durationMonths ? `${r.durationMonths} mesi` : "—"],
            ["Situazione lavorativa", r.workCategory ? WORK_CATEGORIES[r.workCategory] : "—"],
            ["Ricevuta", formatDateTime(r.createdAt)],
            ["Ultimo aggiornamento", formatDateTime(r.updatedAt)],
          ].map(([label, value]) => (
            <div key={label} className="bg-white px-4 py-3.5">
              <dt className="text-xs text-slate">{label}</dt>
              <dd className="mt-0.5 font-medium text-navy-900">{value}</dd>
            </div>
          ))}
        </dl>
        <div className="grid gap-6 border-t border-line p-5 lg:grid-cols-[1.2fr_1fr_auto]">
          <div>
            <p className="text-sm font-semibold text-navy-900">Documenti</p>
            {docs.total ? (
              <>
                <div className="mt-2 flex items-center gap-3">
                  <div
                    className="h-2 flex-1 overflow-hidden rounded-full bg-line"
                    role="progressbar"
                    aria-label="Documenti ricevuti"
                    aria-valuemin={0}
                    aria-valuemax={docs.total}
                    aria-valuenow={docs.received}
                  >
                    <div className="h-full rounded-full bg-teal-700" style={{ width: `${docs.percent}%` }} />
                  </div>
                  <span className="text-sm text-navy-900 tabular-nums">
                    {docs.received}/{docs.total}
                  </span>
                </div>
                {docs.missing.length ? (
                  <div className="mt-3">
                    <p className="text-sm text-slate">Mancanti o da integrare:</p>
                    <ul className="mt-1.5 flex flex-wrap gap-1.5">
                      {docs.missing.map((d) => (
                        <li key={d.id}>
                          <Badge tone={d.status === "da-integrare" ? "danger" : "neutral"}>{d.label}</Badge>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <p className="mt-2 text-sm text-teal-800">Nessun documento essenziale mancante.</p>
                )}
              </>
            ) : (
              <p className="mt-1 text-sm text-slate">Nessun elenco documenti per questo tipo di richiesta.</p>
            )}
          </div>
          <div>
            <p className="text-sm font-semibold text-navy-900">Prossimo passo</p>
            <p className="mt-1 text-navy-900">{nextStep(r)}</p>
          </div>
          <div className="flex flex-wrap items-start gap-2 lg:flex-col">
            {r.contact.phone ? (
              <Button asChild size="sm" variant="secondary">
                <a href={`tel:+${internationalPhone(r.contact.phone)}`}>
                  <Phone aria-hidden /> Chiama
                </a>
              </Button>
            ) : null}
            <Button asChild size="sm" variant="secondary">
              <a href={`mailto:${r.contact.email}?subject=${encodeURIComponent(`AURFIN – Richiesta ${r.reference}`)}`}>
                <Mail aria-hidden /> Email
              </a>
            </Button>
            {r.contact.phone ? (
              <Button asChild size="sm" variant="secondary">
                <a href={`https://wa.me/${internationalPhone(r.contact.phone)}`} target="_blank" rel="noopener noreferrer">
                  <MessageCircle aria-hidden /> WhatsApp<span className="sr-only"> (si apre in una nuova scheda)</span>
                </a>
              </Button>
            ) : null}
          </div>
        </div>
      </section>

      {typeof errore === "string" ? (
        <Notice tone="danger" role="alert" className="mb-6">
          {errore}
        </Notice>
      ) : null}

      {!permissions.manage ? (
        <Notice tone="info" className="mb-6">
          <span className="inline-flex items-center gap-2">
            <Lock aria-hidden className="size-4" />
            {permissions.takeOver
              ? "Questa richiesta non è assegnata. Prendila in carico per poterla gestire."
              : "Sola lettura: puoi modificare solo le pratiche assegnate a te."}
          </span>
        </Notice>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <div className="space-y-6">
          {permissions.manage && !isClosed(r.status) ? (
            <Card title="Rispondi con il preventivo" action={<span className="text-xs text-slate">Entro un giorno lavorativo</span>}>
              <QuoteReply
                requestId={r.id}
                email={r.contact.email}
                draft={quoteDraft(r.contact.fullName, r.reference)}
                link={bookingUrl(r.id)}
                days={BOOKING_LINK_DAYS}
              />
            </Card>
          ) : null}

          <Card title="Condizioni indicate dal cliente">
            {hints.length ? (
              <div className="mb-4 rounded-md border border-brass/50 bg-warning-50 px-4 py-3">
                <p className="text-sm font-semibold text-navy-900">Da verificare nel colloquio</p>
                <ul className="mt-1 list-disc space-y-0.5 pl-5 text-sm text-navy-900">
                  {hints.map((h) => (
                    <li key={h}>{h}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            <dl className="divide-y divide-line">
              <Row label="Tipo di richiesta">{REQUEST_KINDS[r.kind]}</Row>
              {r.renewalOfId ? <Row label="Origine">Rinnovo di una pratica precedente</Row> : null}
              {r.channel ? <Row label="Canale">{r.channel}</Row> : null}
              {r.prequal?.contractType ? <Row label="Contratto">{CONTRACT_TYPES[r.prequal.contractType as keyof typeof CONTRACT_TYPES]}</Row> : null}
              {r.prequal?.seniority ? <Row label="Anzianità">{SENIORITY_BANDS[r.prequal.seniority as keyof typeof SENIORITY_BANDS]}</Row> : null}
              {r.prequal?.employerSize ? <Row label="Dimensione azienda">{EMPLOYER_SIZES[r.prequal.employerSize as keyof typeof EMPLOYER_SIZES]}</Row> : null}
              {r.prequal?.incomeBand ? <Row label="Reddito netto mensile">{INCOME_BANDS[r.prequal.incomeBand as keyof typeof INCOME_BANDS]}</Row> : null}
              {r.prequal?.existingLoans ? <Row label="Finanziamenti in corso">{EXISTING_LOANS[r.prequal.existingLoans as keyof typeof EXISTING_LOANS]}</Row> : null}
              {r.prequal?.ageBand ? <Row label="Età">{AGE_BANDS[r.prequal.ageBand as keyof typeof AGE_BANDS]}</Row> : null}
              <Row label="Ricevuta">{formatDateTime(r.createdAt)}</Row>
              {r.solution ? <Row label="Soluzione">{SOLUTIONS[r.solution]}</Row> : null}
              {r.workCategory ? <Row label="Situazione lavorativa">{WORK_CATEGORIES[r.workCategory]}</Row> : null}
              {r.amount ? <Row label="Importo indicato">{formatEuro(r.amount)}</Row> : null}
              {r.durationMonths ? <Row label="Durata indicata">{formatMonths(r.durationMonths)}</Row> : null}
              {r.topic ? <Row label="Argomento">{CONTACT_TOPICS[r.topic as keyof typeof CONTACT_TOPICS] ?? r.topic}</Row> : null}
              {r.booking ? (
                <Row label="Appuntamento">
                  {r.booking.startsAt ? (
                    <span className="first-letter:uppercase">Telefonata: {formatAppointment(r.booking.startsAt)}</span>
                  ) : (
                    <>
                      {MEETING_MODES[r.booking.mode]}
                      {r.booking.days?.length ? ` · ${r.booking.days.map((d) => WEEKDAYS[d as keyof typeof WEEKDAYS]).join(", ")}` : ""}
                      {r.booking.timeSlot ? ` · ${TIME_SLOTS[r.booking.timeSlot as keyof typeof TIME_SLOTS]?.toLowerCase()}` : ""}
                    </>
                  )}
                </Row>
              ) : null}
              {r.message ? <Row label="Messaggio">{r.message}</Row> : null}
            </dl>
          </Card>

          <Card title="Contatti">
            <dl className="divide-y divide-line">
              <Row label="Email">
                <a href={`mailto:${r.contact.email}`} className="text-teal-700 hover:underline">{r.contact.email}</a>
              </Row>
              <Row label="Telefono">{r.contact.phone ?? "—"}</Row>
              {r.contact.preference ? (
                <Row label="Preferenza">
                  {CONTACT_PREFERENCES[r.contact.preference]}
                  {r.contact.timeSlot ? `, ${TIME_SLOTS[r.contact.timeSlot as keyof typeof TIME_SLOTS]?.toLowerCase()}` : ""}
                </Row>
              ) : null}
              <Row label="Informativa privacy">Presa visione il {formatDateTime(r.privacyAckAt)}</Row>
              <Row label="Consenso marketing">{r.marketingConsent ? "Sì" : "No"}</Row>
            </dl>
          </Card>

          <Card title="Note interne" action={<span className="text-xs text-slate">Non visibili al cliente</span>}>
            {permissions.manage ? (
              <form action={addNote} className="mb-6 space-y-3">
                <input type="hidden" name="id" value={r.id} />
                <Label htmlFor="note-body">Nuova nota</Label>
                <Textarea id="note-body" name="body" rows={3} required minLength={2} maxLength={2000} />
                <Button type="submit" size="sm">Aggiungi nota</Button>
              </form>
            ) : null}
            {notes.length ? (
              <ul className="space-y-4">
                {notes.map((n) => (
                  <li key={n.id} className="rounded-md bg-ivory px-4 py-3">
                    <p className="text-sm text-slate">
                      {getUser(n.authorId)?.name ?? "—"} · {formatDateTime(n.createdAt)}
                    </p>
                    <p className="mt-1 whitespace-pre-line text-navy-900">{n.body}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState title="Nessuna nota" />
            )}
          </Card>

          <Card
            title="Documenti"
            action={<span className="text-xs text-slate">{r.attachments.length} file allegati</span>}
          >
            {r.documents.length ? (
              <ul className="divide-y divide-line">
                {r.documents.map((d) => {
                  const atts = r.attachments.filter((a) => a.documentId === d.id);
                  return (
                  <li key={d.id} className="flex flex-col gap-3 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <p className="font-medium text-navy-900">{d.label}</p>
                      <div className="mt-1"><DocumentBadge status={d.status} /></div>
                      {atts.length ? (
                        <ul className="mt-2 space-y-1">
                          {atts.map((a) => (
                            <li key={a.id} className="flex flex-wrap items-center gap-x-2 text-sm">
                              <FileText aria-hidden className="size-4 shrink-0 text-teal-700" />
                              <a href={`/api/team/documenti/${a.id}`} target="_blank" rel="noopener" className="break-all text-teal-700 hover:underline">
                                {a.originalName}
                              </a>
                              <span className="text-slate">
                                {formatBytes(a.size)} · {formatDateTime(a.uploadedAt)} ·{" "}
                                {a.uploadedBy === "sito" ? "con la richiesta" : a.uploadedBy === "cliente" ? "dall'area cliente" : "dal personale"}
                              </span>
                              {isAdmin ? (
                                <form action={removeAttachment}>
                                  <input type="hidden" name="id" value={r.id} />
                                  <input type="hidden" name="attachmentId" value={a.id} />
                                  <ConfirmButton message={`Eliminare definitivamente ${a.originalName}?`}>Elimina</ConfirmButton>
                                </form>
                              ) : null}
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </div>
                    {permissions.manage ? (
                      <form action={setDocumentStatus} className="flex items-center gap-2">
                        <input type="hidden" name="id" value={r.id} />
                        <input type="hidden" name="docId" value={d.id} />
                        <label htmlFor={`doc-${d.id}`} className="sr-only">Stato di {d.label}</label>
                        <Select id={`doc-${d.id}`} name="status" defaultValue={d.status} className="h-10 text-sm">
                          {(Object.keys(DOCUMENT_STATUSES) as DocumentStatus[]).map((s) => (
                            <option key={s} value={s}>{DOCUMENT_STATUSES[s]}</option>
                          ))}
                        </Select>
                        <Button type="submit" size="sm" variant="secondary">Aggiorna</Button>
                      </form>
                    ) : null}
                  </li>
                  );
                })}
              </ul>
            ) : (
              <EmptyState title="Nessun documento richiesto" text="Aggiungi qui sotto i documenti da chiedere al cliente." />
            )}
            {permissions.manage ? (
              <form action={requestDocument} className="mt-5 grid gap-3 border-t border-line pt-5 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
                <input type="hidden" name="id" value={r.id} />
                <div>
                  <Label htmlFor="doc-label">Richiedi un altro documento</Label>
                  <Input id="doc-label" name="label" required minLength={3} maxLength={80} placeholder="Es. Conteggio estintivo" className="mt-1.5" />
                </div>
                <div>
                  <Label htmlFor="doc-desc">Indicazioni per il cliente (facoltative)</Label>
                  <Input id="doc-desc" name="description" maxLength={160} className="mt-1.5" />
                </div>
                <Button type="submit" size="sm" className="h-12">Aggiungi</Button>
              </form>
            ) : null}
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Stato della pratica">
            {permissions.manage ? (
              <form action={changeStatus} className="space-y-3">
                <input type="hidden" name="id" value={r.id} />
                <Label htmlFor="status">Stato</Label>
                <Select id="status" name="status" defaultValue={r.status}>
                  {(Object.keys(STATUSES) as RequestStatus[]).map((s) => (
                    <option key={s} value={s}>{STATUSES[s].label}</option>
                  ))}
                </Select>
                <Button type="submit" size="sm">Aggiorna stato</Button>
              </form>
            ) : (
              <StatusBadge status={r.status} />
            )}
          </Card>

          {r.kind === "preventivo" ? (
            <Card title="Finanziamento erogato">
              {r.contract ? (
                <dl className="mb-4 divide-y divide-line">
                  <Row label="Erogato il">{formatDateTime(r.contract.disbursedAt)}</Row>
                  <Row label="Importo">{formatEuro(r.contract.amount)}</Row>
                  <Row label="Durata">{formatMonths(r.contract.durationMonths)}</Row>
                  <Row label="Finanziatore">{r.contract.lender}</Row>
                  {r.contract.installment ? <Row label="Rata">{formatEuro(r.contract.installment)}</Row> : null}
                  <Row label="Rinnovo stimato dal">{formatDateTime(renewableAt(r.contract))}</Row>
                </dl>
              ) : (
                <p className="mb-4 text-sm text-slate">Compila solo dopo l&apos;erogazione: la pratica si chiude e compare in «Rinnovi».</p>
              )}
              {permissions.manage ? (
                <form action={saveContract} className="space-y-3">
                  <input type="hidden" name="id" value={r.id} />
                  <div>
                    <Label htmlFor="c-date">Data di erogazione</Label>
                    <Input id="c-date" name="disbursedAt" type="date" required defaultValue={r.contract?.disbursedAt.slice(0, 10)} className="mt-1.5" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="c-amount">Importo (€)</Label>
                      <Input id="c-amount" name="amount" type="number" min={1} required defaultValue={r.contract?.amount ?? r.amount ?? undefined} className="mt-1.5" />
                    </div>
                    <div>
                      <Label htmlFor="c-months">Durata (mesi)</Label>
                      <Input id="c-months" name="durationMonths" type="number" min={1} max={360} required defaultValue={r.contract?.durationMonths ?? r.durationMonths ?? undefined} className="mt-1.5" />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="c-lender">Finanziatore</Label>
                    <Input id="c-lender" name="lender" required minLength={2} maxLength={120} defaultValue={r.contract?.lender} className="mt-1.5" />
                  </div>
                  <div>
                    <Label htmlFor="c-inst">Rata mensile (€, facoltativa)</Label>
                    <Input id="c-inst" name="installment" type="number" min={1} step="0.01" defaultValue={r.contract?.installment ?? undefined} className="mt-1.5" />
                  </div>
                  <Button type="submit" size="sm">{r.contract ? "Aggiorna" : "Registra e chiudi la pratica"}</Button>
                </form>
              ) : null}
            </Card>
          ) : null}

          <Card title="Assegnazione">
            {permissions.assignAny ? (
              <form action={assign} className="space-y-3">
                <input type="hidden" name="id" value={r.id} />
                <Label htmlFor="assigneeId">Consulente</Label>
                <Select id="assigneeId" name="assigneeId" defaultValue={r.assigneeId ?? ""}>
                  <option value="">Nessuno</option>
                  {listConsultants().map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </Select>
                <Button type="submit" size="sm">Salva assegnazione</Button>
              </form>
            ) : permissions.takeOver ? (
              <form action={takeOver}>
                <input type="hidden" name="id" value={r.id} />
                <Button type="submit" size="sm">Prendi in carico</Button>
              </form>
            ) : (
              <p className="text-navy-900">{assignee?.name ?? "Non assegnata"}</p>
            )}
          </Card>

          <Card title="Appuntamenti">
            {appointments.length ? (
              <ul className="mb-6 space-y-3">
                {appointments.map((a) => (
                  <li key={a.id} className="rounded-md border border-line p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium text-navy-900">{formatDateTime(a.startsAt)}</p>
                        <p className="text-sm text-slate">{MEETING_MODES[a.mode]}{a.note ? ` · ${a.note}` : ""}</p>
                      </div>
                      <AppointmentBadge status={a.status} />
                    </div>
                    {permissions.manage ? (
                      <form action={setAppointmentStatus} className="mt-3 flex items-center gap-2">
                        <input type="hidden" name="id" value={r.id} />
                        <input type="hidden" name="apptId" value={a.id} />
                        <label htmlFor={`appt-${a.id}`} className="sr-only">Stato appuntamento</label>
                        <Select id={`appt-${a.id}`} name="status" defaultValue={a.status} className="h-10 text-sm">
                          {(Object.keys(APPOINTMENT_STATUSES) as AppointmentStatus[]).map((s) => (
                            <option key={s} value={s}>{APPOINTMENT_STATUSES[s]}</option>
                          ))}
                        </Select>
                        <Button type="submit" size="sm" variant="secondary">Aggiorna</Button>
                      </form>
                    ) : null}
                  </li>
                ))}
              </ul>
            ) : (
              <div className="mb-6"><EmptyState title="Nessun appuntamento" /></div>
            )}
            {permissions.manage ? (
              <form action={scheduleAppointment} className="space-y-3 border-t border-line pt-5">
                <input type="hidden" name="id" value={r.id} />
                <p className="font-medium text-navy-900">Fissa una telefonata</p>
                <div className="grid grid-cols-[1fr_6rem] gap-2">
                  <div>
                    <Label htmlFor="appt-date">Giorno</Label>
                    <Input id="appt-date" name="date" type="date" required className="mt-1.5" />
                  </div>
                  <div>
                    <Label htmlFor="appt-time">Ora</Label>
                    <Select id="appt-time" name="time" className="mt-1.5 px-2.5 pr-7 tabular-nums">
                      {SLOT_TIMES.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </Select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="appt-note">Nota per il cliente (facoltativa)</Label>
                  <Input id="appt-note" name="note" maxLength={300} className="mt-1.5" />
                </div>
                <Button type="submit" size="sm">Fissa la telefonata</Button>
                <p className="text-xs text-slate">Un orario già occupato viene rifiutato. Controlla il <Link href="/team/planner" className="text-teal-700 underline">planner</Link>.</p>
              </form>
            ) : null}
          </Card>

          <Card title="Storico delle modifiche">
            <ol className="space-y-3">
              {history.map((h) => (
                <li key={h.id} className="border-l-2 border-line pl-3">
                  <p className="text-sm text-navy-900">{h.summary}</p>
                  <p className="text-xs text-slate">
                    {formatDateTime(h.at)} · {h.actorId ? getUser(h.actorId)?.name : "Sistema"}
                  </p>
                </li>
              ))}
            </ol>
          </Card>
        </div>
      </div>
    </>
  );
}
