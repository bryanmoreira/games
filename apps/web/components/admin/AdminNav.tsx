"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Item = { href: string; label: string; icon: React.ReactNode };

const svg = (paths: React.ReactNode) => (
  <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={2.25} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {paths}
  </svg>
);

export const ShieldIcon = ({ className = "h-4 w-4" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={`shrink-0 ${className}`} fill="none" stroke="currentColor" strokeWidth={2.25} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 3 4 6v6c0 4.5 3.4 8.3 8 9 4.6-.7 8-4.5 8-9V6l-8-3Z" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);

/** Seções do admin. Nova seção = nova linha aqui + página em app/admin/<rota>. */
const ITEMS: Item[] = [
  {
    href: "/admin/usuarios",
    label: "Usuários",
    icon: svg(
      <>
        <circle cx="9" cy="8" r="4" />
        <path d="M2 21a7 7 0 0 1 14 0" />
        <path d="M16 3.5a4 4 0 0 1 0 9M22 21a7 7 0 0 0-4-6.3" />
      </>,
    ),
  },
];

export function AdminNav() {
  const pathname = usePathname();
  const base = "flex items-center gap-1.5 rounded-xl px-2.5 py-2 text-[13px] transition md:gap-3 md:px-3 md:py-2.5 md:text-sm";

  return (
    <nav aria-label="Admin" className="-mx-4 overflow-x-auto px-4 md:mx-0 md:overflow-visible md:px-0">
      <div className="mb-3 hidden items-center gap-2 px-3 font-display text-sm tracking-wider text-gold md:flex">
        <ShieldIcon />
        ADMIN
      </div>
      <ul className="flex gap-1 md:sticky md:top-6 md:flex-col md:gap-1">
        {ITEMS.map((it) => {
          const active = pathname.startsWith(it.href);
          return (
            <li key={it.href} className="shrink-0">
              <Link
                href={it.href}
                aria-current={active ? "page" : undefined}
                aria-label={it.label}
                title={it.label}
                className={`${base} ${active ? "bg-gold/15 text-gold ring-1 ring-gold/40" : "text-white/60 hover:bg-white/5 hover:text-white"}`}
              >
                {it.icon}
                <span className={active ? undefined : "hidden md:inline"}>{it.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
