import { ChipIcon, GiftIcon } from "@/components/chips/ChipIcon";
import { LoginStrip } from "@/components/chips/LoginStrip";
import { AchievementIcon } from "@/components/stats/AchievementIcon";
import { loginDayOf, type ChipEntry, type ChipsState } from "@/lib/chips";
import { ACHIEVEMENT_BY_CODE, dayKey, prevDay } from "@/lib/stats/achievements";
import { GAME_INFO } from "@/lib/stats/games";
import { ITEM_BY_ID } from "@/lib/shop/catalog";
import { ShieldIcon } from "@/components/admin/AdminNav";

const CARD = "rounded-2xl bg-white/5 ring-1 ring-white/10";
const DAY_FMT = new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo", day: "numeric", month: "short", year: "numeric" });
const TIME_FMT = new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo", hour: "2-digit", minute: "2-digit" });

function StoreIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={2.25} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 9l1.5-5h15L21 9M3 9h18M3 9v11h18V9M9 20v-6h6v6" />
    </svg>
  );
}

/** Ícone, título e detalhe de cada linha. */
function describe(e: ChipEntry): { icon: React.ReactNode; title: string; sub: string } {
  const cls = "h-4 w-4";
  if (e.reason === "achievement") {
    const a = ACHIEVEMENT_BY_CODE.get(e.ref);
    return {
      icon: <AchievementIcon icon={a?.icon ?? "trophy"} className={cls} />,
      title: a?.title ?? "Conquista",
      sub: a?.game ? GAME_INFO[a.game].name : "Conquista",
    };
  }
  if (e.reason === "login") return { icon: <AchievementIcon icon="calendar" className={cls} />, title: "Login diário", sub: `Dia ${loginDayOf(e.delta)}` };
  if (e.reason === "purchase") {
    const it = ITEM_BY_ID.get(e.ref.split(":").slice(0, 2).join(":"));
    return { icon: <StoreIcon className={cls} />, title: it?.name ?? "Item", sub: it?.type === "deck" ? "Baralho" : "Moldura" };
  }
  if (e.reason === "admin") return { icon: <ShieldIcon className={cls} />, title: e.note || (e.delta > 0 ? "Presente" : "Ajuste"), sub: "Admin" };
  return { icon: <GiftIcon className={cls} />, title: "Boas-vindas", sub: "Conta nova" };
}

function dayLabel(key: string, today: string) {
  if (key === today) return "Hoje";
  if (key === prevDay(today)) return "Ontem";
  return DAY_FMT.format(new Date(`${key}T12:00:00-03:00`));
}

/** Página Fichas do perfil: saldo, sequência de login e cada ficha ganha ou gasta, por dia. */
export function ChipsView({ state, history }: { state: ChipsState; history: ChipEntry[] }) {
  const today = dayKey(new Date());
  const days = new Map<string, ChipEntry[]>();
  for (const e of history) {
    const k = dayKey(e.at);
    days.set(k, [...(days.get(k) ?? []), e]);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className={`${CARD} flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:gap-6 sm:p-5`}>
        <div className="flex items-center gap-3">
          <ChipIcon className="h-14 w-14 shrink-0 drop-shadow-[0_3px_5px_rgba(0,0,0,0.5)]" />
          <span className="font-display text-4xl tabular-nums text-gold">{state.chips.toLocaleString("pt-BR")}</span>
        </div>
        <div className="sm:ml-auto sm:w-80">
          <LoginStrip rewards={state.rewards} streak={state.streak} />
        </div>
      </div>

      {[...days].map(([k, list]) => {
        const sum = list.reduce((s, e) => s + e.delta, 0);
        return (
          <section key={k} className="flex flex-col gap-2">
            <h2 className="flex items-center justify-between font-display text-sm text-white/80">
              {dayLabel(k, today).toUpperCase()}
              <span className={`text-xs tabular-nums ${sum < 0 ? "text-red-400" : "text-gold"}`}>
                {sum > 0 ? "+" : ""}
                {sum.toLocaleString("pt-BR")}
              </span>
            </h2>
            <ul className={`${CARD} divide-y divide-white/5`}>
              {list.map((e) => {
                const d = describe(e);
                const lost = e.delta < 0;
                return (
                  <li key={e.id} className="flex items-center gap-3 px-3 py-2.5">
                    <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${lost ? "bg-red-500/15 text-red-400" : "bg-gold/15 text-gold"}`}>{d.icon}</span>
                    <span className="flex min-w-0 flex-1 flex-col leading-tight">
                      <span className="truncate text-sm font-semibold text-white">{d.title}</span>
                      <span className="truncate text-[11px] text-white/40">
                        {d.sub} · {TIME_FMT.format(e.at)}
                      </span>
                    </span>
                    <span className={`flex items-center gap-1 font-display text-sm tabular-nums ${lost ? "text-red-400" : "text-gold"}`}>
                      {lost ? "−" : "+"}
                      {Math.abs(e.delta).toLocaleString("pt-BR")}
                      <ChipIcon className={`h-4 w-4 ${lost ? "grayscale" : ""}`} />
                    </span>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
