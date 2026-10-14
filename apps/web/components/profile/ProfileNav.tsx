"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ShieldIcon } from "@/components/admin/AdminNav";
import { authClient } from "@/lib/auth-client";
import { refreshIdentity } from "@/lib/socket";

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
    href: "/perfil/conquistas",
    label: "Conquistas",
    icon: svg(<path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1 6.2L12 17.3 6.5 20.2l1-6.2L3 9.6l6.2-.9Z" />),
  },
  {
    href: "/perfil/amigos",
    label: "Amigos",
    icon: svg(
      <>
        <circle cx="9" cy="8" r="4" />
        <path d="M2 21a7 7 0 0 1 14 0" />
        <path d="M16 3.5a4 4 0 0 1 0 9M22 21a7 7 0 0 0-4-6.3" />
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

/** `badges`: número ao lado da opção (ex.: convites de amizade em /perfil/amigos). `admin`: atalho para /admin. */
export function ProfileNav({ badges = {}, admin = false }: { badges?: Record<string, number>; admin?: boolean }) {
  const pathname = usePathname();
  const router = useRouter();

  const signOut = async () => {
    await authClient.signOut();
    void refreshIdentity();
    router.push("/");
    router.refresh();
  };

  // no celular as abas ficam numa fileira: mais compactas, e as inativas e "Sair" só com o ícone
  const base = "flex items-center gap-1.5 rounded-xl px-2.5 py-2 text-[13px] transition md:gap-3 md:px-3 md:py-2.5 md:text-sm";

  return (
    <nav aria-label="Perfil" className="-mx-4 overflow-x-auto px-4 md:mx-0 md:overflow-visible md:px-0">
      <ul className="flex gap-1 md:sticky md:top-6 md:flex-col md:gap-1">
        {ITEMS.map((it) => {
          const active = pathname === it.href;
          const badge = badges[it.href] ?? 0;
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
                {/* no celular só a aba ativa mostra o nome */}
                <span className={active ? undefined : "hidden md:inline"}>{it.label}</span>
                {badge > 0 && (
                  <span
                    aria-label={`${badge} novo${badge > 1 ? "s" : ""}`}
                    className="flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-gold px-1 text-[10px] font-semibold tabular-nums text-[#2a1a04] md:ml-auto"
                  >
                    {badge > 9 ? "9+" : badge}
                  </span>
                )}
              </Link>
            </li>
          );
        })}
        {admin && (
          <li className="shrink-0 md:mt-4 md:border-t md:border-white/10 md:pt-4">
            <Link href="/admin" aria-label="Admin" title="Admin" className={`${base} text-gold/70 hover:bg-gold/10 hover:text-gold`}>
              <ShieldIcon />
              <span className="hidden md:inline">Admin</span>
            </Link>
          </li>
        )}
        <li className={`shrink-0 ${admin ? "" : "md:mt-4 md:border-t md:border-white/10 md:pt-4"}`}>
          <button onClick={signOut} aria-label="Sair" title="Sair" className={`${base} w-full text-white/50 hover:bg-white/5 hover:text-white`}>
            {svg(
              <>
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <path d="m16 17 5-5-5-5" />
                <path d="M21 12H9" />
              </>,
            )}
            <span className="hidden md:inline">Sair</span>
          </button>
        </li>
      </ul>
    </nav>
  );
}
