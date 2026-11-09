import * as React from "react";
import { cn } from "@/lib/utils";

const controlBase =
  "w-full rounded-md border border-line-strong bg-white px-3.5 text-base text-navy-900 transition-colors placeholder:text-slate/70 hover:border-navy-700/50 focus-visible:border-teal-700 focus-visible:outline-2 focus-visible:outline-offset-0 aria-[invalid=true]:border-danger disabled:cursor-not-allowed disabled:bg-ivory disabled:text-slate";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...props }, ref) {
    return <input ref={ref} className={cn(controlBase, "h-12", className)} {...props} />;
  },
);

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(function Textarea({ className, ...props }, ref) {
  return <textarea ref={ref} className={cn(controlBase, "min-h-32 py-3 leading-relaxed", className)} {...props} />;
});

export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  function Select({ className, children, ...props }, ref) {
    return (
      <div className="relative">
        <select ref={ref} className={cn(controlBase, "h-12 appearance-none pr-10", className)} {...props}>
          {children}
        </select>
        <svg
          aria-hidden
          viewBox="0 0 16 16"
          className="pointer-events-none absolute top-1/2 right-3.5 size-4 -translate-y-1/2 text-slate"
        >
          <path d="M4 6l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      </div>
    );
  },
);

export function Label({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn("block text-[0.9375rem] font-medium text-navy-900", className)} {...props} />;
}

type FieldProps = {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  optional?: boolean;
  className?: string;
  children: (aria: {
    id: string;
    "aria-invalid": boolean;
    "aria-describedby"?: string;
  }) => React.ReactNode;
};

/** Campo con etichetta visibile, suggerimento ed errore collegati via aria-describedby. */
export function Field({ id, label, hint, error, optional, className, children }: FieldProps) {
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;
  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={id}>
        {label}
        {optional ? <span className="ml-1.5 font-normal text-slate">(facoltativo)</span> : null}
      </Label>
      {hint ? (
        <p id={hintId} className="text-sm text-slate">
          {hint}
        </p>
      ) : null}
      {children({ id, "aria-invalid": Boolean(error), "aria-describedby": describedBy })}
      <FieldError id={errorId} message={error} />
    </div>
  );
}

export function FieldError({ id, message }: { id?: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="flex items-start gap-1.5 text-sm font-medium text-danger">
      <svg aria-hidden viewBox="0 0 16 16" className="mt-0.5 size-4 shrink-0">
        <circle cx="8" cy="8" r="7" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <path d="M8 4.5v4.2M8 11v.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
      {message}
    </p>
  );
}

type CheckboxProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label: React.ReactNode;
  description?: React.ReactNode;
  error?: string;
};

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  { id, label, description, error, className, ...props },
  ref,
) {
  const errorId = error ? `${id}-error` : undefined;
  const descId = description ? `${id}-desc` : undefined;
  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-start gap-3">
        <input
          ref={ref}
          id={id}
          type="checkbox"
          aria-invalid={Boolean(error)}
          aria-describedby={[descId, errorId].filter(Boolean).join(" ") || undefined}
          className="mt-0.5 size-5 shrink-0 cursor-pointer rounded border-line-strong accent-navy-900"
          {...props}
        />
        <div className="text-[0.9375rem] leading-relaxed">
          <label htmlFor={id} className="cursor-pointer text-navy-900">
            {label}
          </label>
          {description ? (
            <p id={descId} className="mt-1 text-sm text-slate">
              {description}
            </p>
          ) : null}
        </div>
      </div>
      <FieldError id={errorId} message={error} />
    </div>
  );
});
