import { cn } from "@/lib/utils";

/**
 * Logo AURFIN ricostruito in SVG dalla tavola di identità fornita.
 * Per sostituirlo con il file ufficiale: salvare l'SVG in /public/brand/ e
 * rendere qui un <img>, mantenendo `aria-label` e dimensioni.
 */
export function LogoMark({ className, mono = false }: { className?: string; mono?: boolean }) {
  return (
    <svg viewBox="0 0 340 250" aria-hidden className={cn("h-7 w-auto", className)}>
      <polygon points="0,248 153,0 210,0 63,248" fill={mono ? "currentColor" : "#176B68"} />
      <polygon points="188,82 218,28 338,248 274,248" fill={mono ? "currentColor" : "#176B68"} />
      <path
        d="M98 208 C 120 172, 150 160, 186 160 C 206 160, 222 170, 236 184 C 206 174, 150 176, 98 208 Z"
        fill={mono ? "currentColor" : "#B69A65"}
      />
    </svg>
  );
}

export function Logo({
  className,
  inverse = false,
}: {
  className?: string;
  inverse?: boolean;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)} aria-label="AURFIN">
      <LogoMark className="h-[1.6rem]" mono={inverse} />
      <span
        aria-hidden
        className={cn(
          "font-brand text-[1.3rem] leading-none font-semibold tracking-[0.12em]",
          inverse ? "text-ivory" : "text-navy-900",
        )}
      >
        AURFIN
      </span>
    </span>
  );
}
