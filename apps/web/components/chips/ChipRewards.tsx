"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { claimChips, dismissGained, resetChips, useChips, useGained } from "@/lib/chips-client";
import { ChipIcon, GiftIcon } from "@/components/chips/ChipIcon";
import { LoginStrip } from "@/components/chips/LoginStrip";
import { CHIPS_PATH } from "@/components/chips/ChipBalance";
import { AchievementIcon } from "@/components/stats/AchievementIcon";

/** Logado: ao abrir o site pega as fichas do dia e mostra o que entrou (boas-vindas, conquistas antigas, login). */
export function ChipRewards() {
  const { data } = authClient.useSession();
  const userId = data?.user.id;
  const gained = useGained();
  const state = useChips();
  const pathname = usePathname();
  const router = useRouter();
  // na página Fichas o histórico veio do servidor antes do prêmio entrar
  const close = () => {
    dismissGained();
    if (pathname === CHIPS_PATH) router.refresh();
  };

  useEffect(() => {
    if (userId) void claimChips(userId);
    else resetChips();
  }, [userId]);

  if (!gained.length || !state) return null;

  const total = gained.reduce((s, g) => s + g.delta, 0);
  const welcome = gained.find((g) => g.reason === "welcome");
  const login = gained.find((g) => g.reason === "login");
  const ach = gained.filter((g) => g.reason === "achievement");
  const achSum = ach.reduce((s, g) => s + g.delta, 0);

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={close}>
      <div
        role="dialog"
        aria-label={`+${total} fichas`}
        onClick={(e) => e.stopPropagation()}
        className="achievement-pop felt flex w-full max-w-xs flex-col items-center gap-4 rounded-[32px] p-6 shadow-[0_20px_50px_rgba(0,0,0,0.6)] ring-1 ring-gold/40"
      >
        <ChipIcon className="chip-spin h-24 w-24 drop-shadow-[0_6px_10px_rgba(0,0,0,0.5)]" />
        <span className="font-display text-4xl text-gold drop-shadow-[0_3px_0_#7a4e0c]">+{total.toLocaleString("pt-BR")}</span>

        <div className="flex w-full flex-col gap-1.5">
          {welcome && <Row icon={<GiftIcon className="h-4 w-4" />} label="Boas-vindas" value={welcome.delta} />}
          {ach.length > 0 && (
            <Row icon={<AchievementIcon icon="trophy" className="h-4 w-4" />} label={`${ach.length} ${ach.length === 1 ? "conquista" : "conquistas"}`} value={achSum} />
          )}
          {login && <Row icon={<AchievementIcon icon="calendar" className="h-4 w-4" />} label={`Dia ${state.streak}`} value={login.delta} />}
        </div>

        {login && (
          <div className="w-full">
            <LoginStrip rewards={state.rewards} streak={state.streak} today />
          </div>
        )}

        <button onClick={close} autoFocus className="h-11 w-full rounded-full bg-gold font-display text-lg text-[#2a1a04] transition hover:brightness-110">
          Pegar
        </button>
      </div>
    </div>
  );
}

function Row({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="flex items-center gap-2.5 rounded-xl bg-black/25 px-3 py-2 text-sm">
      <span className="text-gold">{icon}</span>
      <span className="flex-1 text-white/85">{label}</span>
      <span className="font-semibold tabular-nums text-gold">+{value}</span>
    </div>
  );
}
