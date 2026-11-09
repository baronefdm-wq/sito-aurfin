"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export type AppNavItem = { href: string; label: string; exact?: boolean };

export function AppNav({ items, label }: { items: AppNavItem[]; label: string }) {
  const pathname = usePathname();
  const isActive = (item: AppNavItem) =>
    item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);

  return (
    <nav aria-label={label} className="border-b border-line bg-paper lg:border-r lg:border-b-0">
      <ul className="flex gap-1 overflow-x-auto px-4 py-2 [scrollbar-width:none] lg:sticky lg:top-0 lg:flex-col lg:px-3 lg:py-6">
        {items.map((item) => (
          <li key={item.href} className="shrink-0">
            <Link
              href={item.href}
              aria-current={isActive(item) ? "page" : undefined}
              className={cn(
                "flex min-h-11 items-center rounded-md px-3 text-[0.9375rem] whitespace-nowrap transition-colors",
                isActive(item) ? "bg-navy-900 text-ivory" : "text-navy-900 hover:bg-ivory",
              )}
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
