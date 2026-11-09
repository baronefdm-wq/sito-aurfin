"use client";

/** Pulsante per azioni irreversibili: chiede conferma prima di inviare il modulo. */
export function ConfirmButton({ message, children }: { message: string; children: React.ReactNode }) {
  return (
    <button
      type="submit"
      onClick={(e) => {
        if (!window.confirm(message)) e.preventDefault();
      }}
      className="inline-flex min-h-8 items-center rounded px-1.5 text-sm font-medium text-danger underline underline-offset-2 hover:bg-danger-50"
    >
      {children}
    </button>
  );
}
