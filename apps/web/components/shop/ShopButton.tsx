"use client";

import Link from "next/link";
import { authClient } from "@/lib/auth-client";

export const SHOP_PATH = "/loja";

/** Atalho para a loja (ao lado do saldo de fichas). Só para quem está logado. */
export function ShopButton({ className = "" }: { className?: string }) {
  const { data } = authClient.useSession();
  if (!data?.user) return null;

  return (
    <Link
      href={SHOP_PATH}
      aria-label="Loja"
      title="Loja"
      className={`flex h-10 w-10 items-center justify-center rounded-full bg-black/30 text-gold ring-1 ring-gold/30 transition hover:bg-black/40 hover:ring-gold/60 ${className}`}
    >
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2.25} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M3 9l1.5-5h15L21 9M3 9h18M3 9v11h18V9M9 20v-6h6v6" />
      </svg>
    </Link>
  );
}
