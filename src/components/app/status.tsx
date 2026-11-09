import { Badge } from "@/components/ui/primitives";
import {
  APPOINTMENT_STATUSES,
  DOCUMENT_STATUSES,
  STATUSES,
  type AppointmentStatus,
  type DocumentStatus,
  type RequestStatus,
} from "@/lib/domain";

const statusTone: Record<RequestStatus, "neutral" | "teal" | "brass" | "navy" | "danger" | "muted"> = {
  nuova: "brass",
  contattato: "neutral",
  consulenza: "neutral",
  documenti: "neutral",
  valutazione: "navy",
  proposta: "teal",
  conclusa: "teal",
  "non-proseguita": "muted",
};

export function StatusBadge({ status, audience = "staff" }: { status: RequestStatus; audience?: "staff" | "client" }) {
  return <Badge tone={statusTone[status]}>{audience === "client" ? STATUSES[status].client : STATUSES[status].label}</Badge>;
}

const docTone: Record<DocumentStatus, "neutral" | "teal" | "brass" | "danger" | "muted"> = {
  "da-caricare": "neutral",
  ricevuto: "brass",
  "da-integrare": "danger",
  verificato: "teal",
};

export function DocumentBadge({ status }: { status: DocumentStatus }) {
  return <Badge tone={docTone[status]}>{DOCUMENT_STATUSES[status]}</Badge>;
}

const apptTone: Record<AppointmentStatus, "neutral" | "teal" | "brass" | "muted"> = {
  proposto: "brass",
  confermato: "teal",
  svolto: "muted",
  annullato: "muted",
};

export function AppointmentBadge({ status }: { status: AppointmentStatus }) {
  return <Badge tone={apptTone[status]}>{APPOINTMENT_STATUSES[status]}</Badge>;
}
