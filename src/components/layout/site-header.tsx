"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { ChevronDown, Menu, UserRound, X } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/primitives";
import { mainNav, solutions } from "@/config/navigation";
import { cn } from "@/lib/utils";

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function SolutionsMenu({ pathname }: { pathname: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const active = solutions.some((s) => isActive(pathname, s.href));

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        ref.current?.querySelector("button")?.focus();
      }
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-controls="menu-soluzioni"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "inline-flex h-11 items-center gap-1 rounded-md px-3 text-[0.9375rem] transition-colors hover:text-teal-700",
          active ? "font-medium text-navy-900" : "text-navy-900/85",
        )}
      >
        Soluzioni
        <ChevronDown aria-hidden className={cn("size-4 transition-transform duration-200", open && "rotate-180")} />
      </button>
      <div
        id="menu-soluzioni"
        hidden={!open}
        className="absolute top-full left-0 z-50 mt-2 w-[22rem] animate-fade-up rounded-lg border border-line bg-white p-2 shadow-lift"
      >
        <ul>
          {solutions.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={isActive(pathname, item.href) ? "page" : undefined}
                onClick={() => setOpen(false)}
                className="block rounded-md px-3.5 py-3 transition-colors hover:bg-ivory"
              >
                <span className="block font-medium text-navy-900">{item.label}</span>
                <span className="mt-0.5 block text-sm leading-snug text-slate">{item.description}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export function SiteHeader() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  // Chiude il menu mobile quando si sceglie una destinazione.
  const closeOnNavigate = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("a")) setMobileOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-line/80 bg-paper/95 backdrop-blur-sm supports-[backdrop-filter]:bg-paper/85">
      <Container className="flex h-[4.5rem] items-center justify-between gap-6">
        <Link href="/" className="rounded-sm" aria-label="AURFIN, torna alla home">
          <Logo />
        </Link>

        <nav aria-label="Navigazione principale" className="hidden xl:block">
          <ul className="flex items-center gap-0.5">
            <li>
              <SolutionsMenu pathname={pathname} />
            </li>
            {mainNav.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={isActive(pathname, item.href) ? "page" : undefined}
                  className="relative inline-flex h-11 items-center rounded-md px-2.5 text-[0.9375rem] whitespace-nowrap text-navy-900/85 transition-colors hover:text-teal-700 aria-[current=page]:font-medium aria-[current=page]:text-navy-900 aria-[current=page]:after:absolute aria-[current=page]:after:inset-x-3 aria-[current=page]:after:bottom-1.5 aria-[current=page]:after:h-px aria-[current=page]:after:bg-brass"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="hidden items-center gap-2 xl:flex">
          <Link
            href="/area-clienti"
            className="inline-flex h-11 items-center gap-2 rounded-md px-2.5 text-[0.9375rem] whitespace-nowrap text-navy-900/85 transition-colors hover:text-teal-700"
          >
            <UserRound aria-hidden className="size-4" />
            Area clienti
          </Link>
          <Button asChild size="sm" className="h-11">
            <Link href="/richiesta-preventivo">Richiedi un preventivo</Link>
          </Button>
        </div>

        <Dialog.Root open={mobileOpen} onOpenChange={setMobileOpen}>
          <Dialog.Trigger asChild>
            <Button variant="quiet" size="icon" className="xl:hidden" aria-label="Apri il menu">
              <Menu aria-hidden className="!size-6" />
            </Button>
          </Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 z-50 bg-navy-950/40 data-[state=open]:animate-[fade-up_0.2s_ease-out]" />
            <Dialog.Content
              onClick={closeOnNavigate}
              aria-describedby={undefined}
              className="fixed inset-y-0 right-0 z-50 flex w-full max-w-sm flex-col overflow-y-auto bg-paper shadow-lift focus:outline-none"
            >
              <div className="flex h-[4.5rem] items-center justify-between border-b border-line px-4">
                <Dialog.Title className="sr-only">Menu</Dialog.Title>
                <Logo />
                <Dialog.Close asChild>
                  <Button variant="quiet" size="icon" aria-label="Chiudi il menu">
                    <X aria-hidden className="!size-6" />
                  </Button>
                </Dialog.Close>
              </div>
              <nav aria-label="Navigazione mobile" className="flex-1 px-4 py-6">
                <p className="px-2 text-xs font-semibold tracking-[0.14em] text-brass-700 uppercase">Soluzioni</p>
                <ul className="mt-2 mb-6">
                  {solutions.map((item) => (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        aria-current={isActive(pathname, item.href) ? "page" : undefined}
                        className="flex min-h-12 items-center rounded-md px-2 text-lg text-navy-900 aria-[current=page]:font-semibold"
                      >
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
                <ul className="border-t border-line pt-4">
                  {mainNav.map((item) => (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        aria-current={isActive(pathname, item.href) ? "page" : undefined}
                        className="flex min-h-12 items-center rounded-md px-2 text-lg text-navy-900 aria-[current=page]:font-semibold"
                      >
                        {item.label}
                      </Link>
                    </li>
                  ))}
                  <li>
                    <Link
                      href="/area-clienti"
                      className="flex min-h-12 items-center gap-2 rounded-md px-2 text-lg text-navy-900"
                    >
                      <UserRound aria-hidden className="size-5" /> Area clienti
                    </Link>
                  </li>
                </ul>
              </nav>
              <div className="border-t border-line p-4">
                <Button asChild size="lg" className="w-full">
                  <Link href="/richiesta-preventivo">Richiedi un preventivo</Link>
                </Button>
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      </Container>
    </header>
  );
}
