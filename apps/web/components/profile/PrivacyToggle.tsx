"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

/** Liga/desliga o perfil público (/perfil/<username>). */
export function PrivacyToggle({ initial }: { initial: boolean }) {
  const router = useRouter();
  const [on, setOn] = useState(initial);
  const [saving, setSaving] = useState(false);

  const toggle = async () => {
    if (saving) return;
    const next = !on;
    setOn(next); // otimista
    setSaving(true);
    const { error } = await authClient.updateUser({ profilePublic: next });
    setSaving(false);
    if (error) return setOn(!next);
    router.refresh();
  };

  return (
    <button
      role="switch"
      aria-checked={on}
      onClick={toggle}
      className="flex w-full items-center gap-4 px-4 py-3.5 text-left sm:px-5"
    >
      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition ${on ? "bg-gold/15 text-gold" : "bg-white/10 text-white/60"}`}>
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.25} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          {on ? (
            <>
              <circle cx="12" cy="12" r="9" />
              <path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
            </>
          ) : (
            <>
              <rect x="4" y="11" width="16" height="10" rx="2" />
              <path d="M8 11V7a4 4 0 0 1 8 0v4" />
            </>
          )}
        </svg>
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="text-sm text-white/90">{on ? "Perfil público" : "Perfil privado"}</span>
        <span className="text-xs text-white/45">{on ? "Qualquer pessoa pode ver" : "Só você pode ver"}</span>
      </span>
      <span className={`relative h-6 w-11 shrink-0 rounded-full transition ${on ? "bg-gold" : "bg-white/15"}`}>
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${on ? "left-[22px]" : "left-0.5"}`} />
      </span>
    </button>
  );
}
