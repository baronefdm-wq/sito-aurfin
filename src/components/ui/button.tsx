import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium transition-[background-color,color,border-color,box-shadow,transform] duration-200 ease-[var(--ease-out-soft)] disabled:pointer-events-none disabled:opacity-50 active:translate-y-px [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary:
          "bg-navy-900 text-ivory hover:bg-navy-800 shadow-[0_1px_0_rgb(255_255_255/0.06)_inset,0_1px_2px_rgb(20_45_64/0.2)]",
        secondary:
          "border border-navy-900/25 bg-paper text-navy-900 hover:border-navy-900/60 hover:bg-white",
        quiet: "text-navy-900 hover:bg-navy-50",
        inverse: "bg-ivory text-navy-950 hover:bg-white",
        "inverse-outline": "border border-ivory/35 text-ivory hover:border-ivory/80 hover:bg-white/5",
        danger: "bg-danger text-white hover:bg-danger/90",
        link: "h-auto px-0 text-teal-700 underline-offset-4 hover:underline",
      },
      size: {
        sm: "h-10 px-3.5 text-sm",
        md: "h-11 px-5 text-[0.9375rem]",
        lg: "h-12 px-6 text-base",
        icon: "size-11",
      },
    },
    compoundVariants: [{ variant: "link", className: "h-auto px-0" }],
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean };

export function Button({ className, variant, size, asChild, ...props }: ButtonProps) {
  const Comp = asChild ? Slot : "button";
  return <Comp className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
