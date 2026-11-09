"use client";

import { cn } from "@/lib/utils";

export type Choice<T extends string | number> = { value: T; label: string; description?: string };

/** Gruppo di scelte esclusive reso come radio nativi (accessibili da tastiera). */
export function ChoiceGroup<T extends string | number>({
  name,
  legend,
  hint,
  choices,
  value,
  onChange,
  error,
  columns = 2,
  size = "md",
  legendClassName,
}: {
  name: string;
  legend: string;
  hint?: string;
  choices: Choice<T>[];
  value: T | undefined;
  onChange: (value: T) => void;
  error?: string;
  columns?: 1 | 2 | 3 | 5;
  size?: "md" | "sm";
  legendClassName?: string;
}) {
  const errorId = error ? `${name}-error` : undefined;
  const hintId = hint ? `${name}-hint` : undefined;
  return (
    <fieldset aria-describedby={[hintId, errorId].filter(Boolean).join(" ") || undefined} aria-invalid={Boolean(error)}>
      <legend className={cn("text-[0.9375rem] font-medium text-navy-900", legendClassName)}>{legend}</legend>
      {hint ? (
        <p id={hintId} className="mt-1.5 text-sm text-slate">
          {hint}
        </p>
      ) : null}
      <div
        className={cn(
          "mt-3 grid gap-2.5",
          columns === 2 && "sm:grid-cols-2",
          columns === 3 && "sm:grid-cols-3",
          columns === 5 && "grid-cols-3 sm:grid-cols-5",
        )}
      >
        {choices.map((c) => {
          const id = `${name}-${c.value}`;
          const checked = value === c.value;
          return (
            <label
              key={String(c.value)}
              htmlFor={id}
              className={cn(
                "relative flex cursor-pointer gap-3 rounded-md border bg-white transition-[border-color,background-color,box-shadow] duration-200 hover:border-navy-700/60 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-teal-700",
                size === "md" ? "items-start p-4" : "min-h-12 items-center justify-center px-3 py-2 text-center",
                checked ? "border-navy-900 bg-navy-50 shadow-[inset_0_0_0_1px_var(--color-navy-900)]" : "border-line-strong",
                error && !checked && "border-danger/50",
              )}
            >
              <input
                id={id}
                type="radio"
                name={name}
                value={String(c.value)}
                checked={checked}
                onChange={() => onChange(c.value)}
                className={size === "md" ? "mt-1 size-4 shrink-0 accent-navy-900" : "sr-only"}
              />
              <span>
                <span className={cn("block text-navy-900", size === "md" ? "font-medium" : "text-[0.9375rem] tabular-nums")}>
                  {c.label}
                </span>
                {c.description ? <span className="mt-1 block text-sm leading-snug text-slate">{c.description}</span> : null}
              </span>
            </label>
          );
        })}
      </div>
      {error ? (
        <p id={errorId} className="mt-2 text-sm font-medium text-danger">
          {error}
        </p>
      ) : null}
    </fieldset>
  );
}
