import * as React from "react";
import { cn } from "@/lib/utils";

export function Container({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("mx-auto w-full max-w-[76rem] px-4 sm:px-6 lg:px-10", className)} {...props} />;
}

export function Eyebrow({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn(
        "flex items-center gap-3 text-[0.8125rem] font-semibold tracking-[0.14em] text-brass-700 uppercase before:h-px before:w-6 before:bg-brass",
        className,
      )}
      {...props}
    />
  );
}

export function SectionHeading({
  eyebrow,
  title,
  intro,
  id,
  className,
  as: Tag = "h2",
}: {
  eyebrow?: string;
  title: React.ReactNode;
  intro?: React.ReactNode;
  id?: string;
  className?: string;
  as?: "h1" | "h2";
}) {
  return (
    <div className={cn("max-w-3xl", className)}>
      {eyebrow ? <Eyebrow className="mb-4">{eyebrow}</Eyebrow> : null}
      <Tag
        id={id}
        className="font-serif text-[1.875rem] leading-[1.15] tracking-[-0.015em] text-navy-900 text-balance sm:text-[2.375rem]"
      >
        {title}
      </Tag>
      {intro ? <div className="mt-5 text-lg leading-relaxed text-slate text-pretty">{intro}</div> : null}
    </div>
  );
}

export function Section({
  className,
  tone = "paper",
  ...props
}: React.HTMLAttributes<HTMLElement> & { tone?: "paper" | "ivory" | "navy" | "white" }) {
  return (
    <section
      className={cn(
        "py-16 sm:py-24",
        tone === "ivory" && "bg-ivory",
        tone === "white" && "bg-white",
        tone === "navy" && "bg-navy-900 text-ivory",
        className,
      )}
      {...props}
    />
  );
}

export function Badge({
  className,
  tone = "neutral",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & {
  tone?: "neutral" | "teal" | "brass" | "navy" | "danger" | "muted";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[0.8125rem] font-medium whitespace-nowrap",
        tone === "neutral" && "border-line-strong bg-white text-navy-900",
        tone === "teal" && "border-teal-700/25 bg-teal-50 text-teal-800",
        tone === "brass" && "border-brass/40 bg-brass-100 text-brass-700",
        tone === "navy" && "border-navy-900 bg-navy-900 text-ivory",
        tone === "danger" && "border-danger/25 bg-danger-50 text-danger",
        tone === "muted" && "border-line bg-ivory text-slate",
        className,
      )}
      {...props}
    />
  );
}

/** Pannello con bordo sottile: usato con parsimonia, non come griglia di card. */
export function Panel({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("rounded-lg border border-line bg-white", className)} {...props} />;
}

export function Notice({
  tone = "info",
  title,
  children,
  className,
  role,
}: {
  tone?: "info" | "warning" | "danger" | "success" | "demo";
  title?: string;
  children?: React.ReactNode;
  className?: string;
  role?: "status" | "alert";
}) {
  return (
    <div
      role={role}
      className={cn(
        "rounded-md border px-4 py-3.5 text-[0.9375rem] leading-relaxed",
        tone === "info" && "border-navy-200 bg-navy-50 text-navy-900",
        tone === "warning" && "border-brass/50 bg-warning-50 text-navy-900",
        tone === "danger" && "border-danger/30 bg-danger-50 text-danger",
        tone === "success" && "border-teal-700/30 bg-teal-50 text-teal-800",
        tone === "demo" && "border-brass/60 bg-brass-100 text-navy-900",
        className,
      )}
    >
      {title ? <p className="font-semibold">{title}</p> : null}
      {children ? <div className={cn(title && "mt-1")}>{children}</div> : null}
    </div>
  );
}
