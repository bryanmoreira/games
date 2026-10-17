"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { loginHref } from "@/lib/login";
import { ChipAvatar } from "@/components/ui/ChipFrame";

/** "Entrar" (vai para /login) ou avatar que leva ao perfil. */
export function UserButton({ className = "" }: { className?: string }) {
  const pathname = usePathname();
  const { data, isPending } = authClient.useSession();
  const user = data?.user;

  if (isPending) return <div className={`h-10 w-10 ${className}`} />;

  if (!user) {
    return (
      <Link
        href={loginHref(pathname)}
        className={`flex h-10 items-center gap-2 rounded-full bg-white/10 px-4 text-sm font-medium text-white/90 ring-1 ring-white/15 transition hover:bg-white/20 hover:text-white ${className}`}
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.25} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="8" r="4" />
          <path d="M4 21a8 8 0 0 1 16 0" />
        </svg>
        Entrar
      </Link>
    );
  }

  return (
    <Link href="/perfil" aria-label="Perfil" title={user.name} className={`group h-10 w-10 ${className}`}>
      {/* a borda gira um pouco ao passar o mouse */}
      <ChipAvatar user={user} className="h-full w-full" frameClassName="transition-transform duration-500 group-hover:rotate-[60deg]" />
    </Link>
  );
}
