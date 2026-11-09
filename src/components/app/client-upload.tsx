"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DOCUMENT_RULES, validateDocument } from "@/lib/documents";

/** Caricamento immediato di un documento dall'area riservata. */
export function ClientUpload({ documentId, label, disabled }: { documentId: string; label: string; disabled?: boolean }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(null);

  const upload = async (file: File | undefined) => {
    if (!file) return;
    const err = validateDocument(file);
    if (err) return setMessage({ tone: "error", text: err });
    setBusy(true);
    setMessage(null);
    const body = new FormData();
    body.append("documentId", documentId);
    body.append("file", file);
    try {
      const res = await fetch("/api/documenti", { method: "POST", body });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (res.ok) {
        setMessage({ tone: "ok", text: `${file.name} caricato.` });
        router.refresh();
      } else setMessage({ tone: "error", text: data.error ?? "Caricamento non riuscito." });
    } catch {
      setMessage({ tone: "error", text: "Connessione non riuscita. Riprova." });
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="flex flex-col items-start gap-1.5 sm:items-end">
      <input
        ref={inputRef}
        type="file"
        accept={DOCUMENT_RULES.accept}
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        onChange={(e) => upload(e.target.files?.[0])}
      />
      <Button type="button" size="sm" variant="secondary" disabled={busy || disabled} onClick={() => inputRef.current?.click()}>
        {busy ? <Loader2 aria-hidden className="animate-spin" /> : <Upload aria-hidden />}
        {busy ? "Caricamento…" : "Carica"}
        <span className="sr-only"> {label}</span>
      </Button>
      {message ? (
        <p role={message.tone === "error" ? "alert" : "status"} className={message.tone === "error" ? "text-sm text-danger" : "text-sm text-teal-800"}>
          {message.text}
        </p>
      ) : null}
    </div>
  );
}
