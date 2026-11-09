import { site } from "@/config/site";
import { cn } from "@/lib/utils";

/**
 * Segnaposto per un dato aziendale non ancora fornito.
 * Visibile solo in modalità revisione; in produzione non viene reso nulla.
 */
export function Placeholder({ children, className }: { children: React.ReactNode; className?: string }) {
  if (!site.reviewMode) return null;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded border border-dashed border-brass bg-brass-100/60 px-1.5 py-0.5 text-[0.8125rem] font-medium text-brass-700",
        className,
      )}
    >
      [{children}]
    </span>
  );
}

/** Mostra un valore configurato oppure un segnaposto. */
export function ConfigValue({ value, label }: { value: string | null | undefined; label: string }) {
  if (value) return <>{value}</>;
  return <Placeholder>{label} — da inserire</Placeholder>;
}

/**
 * Nota editoriale per contenuti informativi o normativi da validare
 * prima della pubblicazione (compliance / ufficio legale).
 */
export function ReviewNote({ children, className }: { children?: React.ReactNode; className?: string }) {
  if (!site.reviewMode) return null;
  return (
    <aside
      aria-label="Nota di revisione"
      className={cn(
        "flex gap-3 rounded-md border border-dashed border-brass/70 bg-brass-100/40 px-4 py-3 text-sm leading-relaxed text-navy-900",
        className,
      )}
    >
      <span className="mt-0.5 shrink-0 self-start rounded-sm bg-brass px-1.5 py-px text-[0.6875rem] font-bold tracking-wider text-navy-950 uppercase">
        Da validare
      </span>
      <span>
        {children ??
          "Contenuto informativo redatto su fonti pubbliche: da verificare con la funzione compliance prima della pubblicazione."}
      </span>
    </aside>
  );
}
