"use client";

import * as AccordionPrimitive from "@radix-ui/react-accordion";
import { cn } from "@/lib/utils";

export type AccordionEntry = { id: string; question: string; answer: React.ReactNode };

export function Accordion({ items, className }: { items: AccordionEntry[]; className?: string }) {
  return (
    <AccordionPrimitive.Root type="multiple" className={cn("divide-y divide-line border-y border-line", className)}>
      {items.map((item) => (
        <AccordionPrimitive.Item key={item.id} value={item.id} id={item.id}>
          <AccordionPrimitive.Header asChild>
            <h3>
              <AccordionPrimitive.Trigger className="group flex w-full items-start justify-between gap-6 py-5 text-left text-[1.0625rem] font-medium text-navy-900 transition-colors hover:text-teal-700">
                <span>{item.question}</span>
                <span
                  aria-hidden
                  className="relative mt-1.5 size-3.5 shrink-0 text-brass-700 before:absolute before:inset-x-0 before:top-1/2 before:h-[1.5px] before:-translate-y-1/2 before:bg-current after:absolute after:inset-y-0 after:left-1/2 after:w-[1.5px] after:-translate-x-1/2 after:bg-current after:transition-transform after:duration-300 group-data-[state=open]:after:scale-y-0"
                />
              </AccordionPrimitive.Trigger>
            </h3>
          </AccordionPrimitive.Header>
          <AccordionPrimitive.Content className="overflow-hidden data-[state=closed]:hidden">
            <div className="max-w-[68ch] pb-6 leading-relaxed text-slate [&_a]:text-teal-700 [&_a]:underline [&_p+p]:mt-3">
              {item.answer}
            </div>
          </AccordionPrimitive.Content>
        </AccordionPrimitive.Item>
      ))}
    </AccordionPrimitive.Root>
  );
}
