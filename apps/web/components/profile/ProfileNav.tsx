"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

type Item = { href: string; label: string; icon: React.ReactNode };

const svg = (paths: React.ReactNode) => (
  <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={2.25} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {paths}
  </svg>
);

/** Opções do perfil. Nova opção = nova linha aqui + página em app/perfil/<rota>. */
const ITEMS: Item[] = [
  {
    href: "/perfil",
    label: "Resumo",
    icon: svg(
      <>
        <path d="M8 21h8M12 17v4" />
        <path d="M7 4h10v5a5 5 0 0 1-10 0V4Z" />
        <path d="M17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3" />
      </>,
    ),
  },
  {
    href: "/perfil/conta",
    label: "Conta",
    icon: svg(
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21a8 8 0 0 1 16 0" />
      </>,
    ),
  },
];

export function ProfileNav() {
  const pathname = usePathname();
  const router = useRouter();

  const signOut = async () => {
    await authClient.signOut();
    router.push("/");
    router.refresh();
  };

  const base = "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition";

  return (
    <nav aria-label="Perfil" className="-mx-4 overflow-x-auto px-4 md:mx-0 md:overflow-visible md:px-0">
      <ul className="flex gap-2 md:sticky md:top-6 md:flex-col md:gap-1">
        {ITEMS.map((it) => {
          const active = pathname === it.href;
          return (
            <li key={it.href} className="shrink-0">
              <Link
                href={it.href}
                aria-current={active ? "page" : undefined}
                className={`${base} ${active ? "bg-gold/15 text-gold ring-1 ring-gold/40" : "text-white/60 hover:bg-white/5 hover:text-white"}`}
              >
                {it.icon}
                {it.label}
              </Link>
            </li>
          );
        })}
        <li className="shrink-0 md:mt-4 md:border-t md:border-white/10 md:pt-4">
          <button onClick={signOut} className={`${base} w-full text-white/50 hover:bg-white/5 hover:text-white`}>
            {svg(
              <>
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <path d="m16 17 5-5-5-5" />
                <path d="M21 12H9" />
              </>,
            )}
            Sair
          </button>
        </li>
      </ul>
    </nav>
  );
}
