import { NextResponse } from "next/server";
import { REQUEST_KINDS, SOLUTIONS, STATUSES, WORK_CATEGORIES } from "@/lib/domain";
import { getViewer } from "@/lib/server/auth";
import { listRequests } from "@/lib/server/repository";
import { getUser } from "@/lib/server/store";

/** I fogli di calcolo eseguono le celle che iniziano con questi caratteri: si neutralizzano. */
const cell = (value: unknown) => {
  const text = String(value ?? "");
  const safe = /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;
  return `"${safe.replace(/"/g, '""')}"`;
};

/** Esportazione CSV delle richieste: solo amministratori. */
export async function GET() {
  const viewer = await getViewer("team");
  if (!viewer || viewer.role !== "amministratore") {
    return NextResponse.json({ error: "Accesso non autorizzato." }, { status: 403 });
  }
  const header = ["Codice", "Tipo", "Ricevuta", "Stato", "Nome", "Email", "Telefono", "Soluzione", "Situazione lavorativa", "Importo", "Durata mesi", "Consulente", "Canale", "Consenso commerciale"];
  const rows = listRequests(viewer).map((r) => [
    r.reference,
    REQUEST_KINDS[r.kind],
    r.createdAt,
    STATUSES[r.status].label,
    r.contact.fullName,
    r.contact.email,
    r.contact.phone,
    r.solution ? SOLUTIONS[r.solution] : "",
    r.workCategory ? WORK_CATEGORIES[r.workCategory] : "",
    r.amount,
    r.durationMonths,
    r.assigneeId ? getUser(r.assigneeId)?.name : "",
    r.channel,
    r.marketingConsent ? "Sì" : "No",
  ]);
  // Punto e virgola e BOM: Excel in italiano apre il file senza passaggi aggiuntivi.
  const csv = "﻿" + [header, ...rows].map((row) => row.map(cell).join(";")).join("\r\n");
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="aurfin-richieste-${new Date().toISOString().slice(0, 10)}.csv"`,
      "Cache-Control": "private, no-store",
    },
  });
}
