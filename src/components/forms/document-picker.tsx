"use client";

import { useId, useRef, useState } from "react";
import { FileText, Paperclip, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { DocumentSlot } from "@/lib/document-requirements";
import { DOCUMENT_RULES, formatBytes, validateDocument } from "@/lib/documents";
import { cn } from "@/lib/utils";

/**
 * Selezione dei file per un documento. I file restano in memoria nel browser
 * finché la richiesta non viene inviata: nulla viene salvato localmente.
 */
export function DocumentPicker({
  slot,
  files,
  onChange,
  disabled,
}: {
  slot: DocumentSlot;
  files: File[];
  onChange: (files: File[]) => void;
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const uid = useId();
  const [errors, setErrors] = useState<string[]>([]);
  const full = files.length >= DOCUMENT_RULES.maxFilesPerSlot;

  const add = (list: FileList | null) => {
    if (!list) return;
    const next = [...files];
    const errs: string[] = [];
    for (const f of Array.from(list)) {
      const err = validateDocument(f);
      if (err) errs.push(`${f.name}: ${err}`);
      else if (next.length >= DOCUMENT_RULES.maxFilesPerSlot) errs.push(`Massimo ${DOCUMENT_RULES.maxFilesPerSlot} file per questo documento.`);
      else if (!next.some((x) => x.name === f.name && x.size === f.size)) next.push(f);
    }
    setErrors(errs);
    onChange(next);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className={cn("rounded-md border bg-white p-4", files.length ? "border-teal-700/40" : "border-line-strong")}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p id={`${uid}-label`} className="font-medium text-navy-900">
            {slot.label}
          </p>
          <p id={`${uid}-hint`} className="text-sm text-slate">
            {slot.hint}
          </p>
        </div>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={DOCUMENT_RULES.accept}
          className="sr-only"
          tabIndex={-1}
          aria-hidden
          onChange={(e) => add(e.target.files)}
        />
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="shrink-0"
          disabled={disabled || full}
          aria-describedby={`${uid}-label ${uid}-hint`}
          onClick={() => inputRef.current?.click()}
        >
          <Paperclip aria-hidden />
          {files.length ? "Aggiungi file" : "Allega file"}
        </Button>
      </div>

      {files.length ? (
        <ul className="mt-3 space-y-1.5" aria-label={`File allegati: ${slot.label}`}>
          {files.map((f, i) => (
            <li key={`${f.name}-${f.size}`} className="flex items-center justify-between gap-3 rounded bg-ivory px-3 py-2 text-sm">
              <span className="flex min-w-0 items-center gap-2 text-navy-900">
                <FileText aria-hidden className="size-4 shrink-0 text-teal-700" />
                <span className="truncate">{f.name}</span>
                <span className="shrink-0 text-slate">{formatBytes(f.size)}</span>
              </span>
              <button
                type="button"
                disabled={disabled}
                onClick={() => onChange(files.filter((_, j) => j !== i))}
                className="inline-flex size-9 shrink-0 items-center justify-center rounded-md text-slate hover:bg-white hover:text-danger"
                aria-label={`Rimuovi ${f.name}`}
              >
                <X aria-hidden className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {errors.length ? (
        <ul role="alert" className="mt-2 space-y-1 text-sm font-medium text-danger">
          {errors.map((e) => (
            <li key={e}>{e}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
