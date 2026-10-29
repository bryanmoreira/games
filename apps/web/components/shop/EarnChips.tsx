import Link from "next/link";
import { ChipIcon } from "@/components/chips/ChipIcon";
import { LoginStrip } from "@/components/chips/LoginStrip";
import { AchievementIcon } from "@/components/stats/AchievementIcon";
import { achievementChips, LOGIN_CHIPS, WELCOME_CHIPS } from "@/lib/chips-rules";
import { loginHref } from "@/lib/login";
import { ACHIEVEMENTS, type AchievementDef } from "@/lib/stats/achievements";
import { GAME_INFO, STAT_GAMES } from "@/lib/stats/games";

const CARD = "rounded-2xl bg-white/5 ring-1 ring-white/10";
const fmt = (n: number) => n.toLocaleString("pt-BR");

const GROUPS: { key: string; name: string; list: AchievementDef[] }[] = [
  { key: "geral", name: "Geral", list: ACHIEVEMENTS.filter((a) => a.game === null) },
  ...STAT_GAMES.map((g) => ({ key: g, name: GAME_INFO[g].name, list: ACHIEVEMENTS.filter((a) => a.game === g) })),
].filter((g) => g.list.length);

const sum = (list: AchievementDef[]) => list.reduce((n, a) => n + achievementChips(a), 0);

function Amount({ n, dim = false }: { n: number; dim?: boolean }) {
  return (
    <span className={`flex shrink-0 items-center gap-1 text-sm font-bold tabular-nums ${dim ? "text-white/35" : "text-gold"}`}>
      <ChipIcon className={`h-4 w-4 ${dim ? "opacity-40 grayscale" : ""}`} />
      {fmt(n)}
    </span>
  );
}

/** Como ganhar fichas: boas-vindas, login diário e cada conquista com quanto paga (sem conta: tudo trancado). */
export function EarnChips({ logged, streak, unlocked }: { logged: boolean; streak: number; unlocked: string[] }) {
  const have = new Set(unlocked);
  const left = sum(ACHIEVEMENTS.filter((a) => !have.has(a.code)));

  return (
    <div className="flex flex-col gap-4">
      {!logged && (
        <Link
          href={loginHref("/loja")}
          className="group flex items-center gap-4 rounded-3xl bg-[linear-gradient(135deg,#3a2a08,#1a140a)] p-4 ring-1 ring-gold/40 transition hover:ring-gold sm:p-5"
        >
          <ChipIcon className="h-14 w-14 shrink-0 drop-shadow-[0_4px_6px_rgba(0,0,0,0.5)] transition-transform duration-500 group-hover:rotate-[72deg]" />
          <span className="flex flex-1 flex-col">
            <span className="font-display text-2xl text-gold">+{WELCOME_CHIPS}</span>
            <span className="text-sm text-white/60">Boas-vindas</span>
          </span>
          <span className="rounded-xl bg-gold px-4 py-2 text-sm font-semibold text-[#2a1a04] shadow-[0_2px_0_#7a4e0c]">Entrar</span>
        </Link>
      )}

      <section className={`${CARD} flex flex-col gap-3 p-4 sm:p-5`}>
        <h2 className="flex items-center justify-between font-display text-sm text-white/80">
          <span className="flex items-center gap-2">
            <AchievementIcon icon="calendar" className="h-4 w-4 text-gold" />
            LOGIN DIÁRIO
          </span>
          <Amount n={LOGIN_CHIPS.reduce((a, b) => a + b, 0)} />
        </h2>
        <LoginStrip rewards={LOGIN_CHIPS} streak={streak} />
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="flex items-center justify-between px-1 font-display text-sm text-white/80">
          <span className="flex items-center gap-2">
            <AchievementIcon icon="trophy" className="h-4 w-4 text-gold" />
            CONQUISTAS
          </span>
          <Amount n={left} />
        </h2>
        {GROUPS.map((g, i) => {
          const got = g.list.filter((a) => have.has(a.code)).length;
          return (
            <details key={g.key} open={i === 0} className={`${CARD} group overflow-hidden`}>
              <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3 transition hover:bg-white/[0.03] [&::-webkit-details-marker]:hidden">
                <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 text-white/40 transition group-open:rotate-90" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="m9 6 6 6-6 6" />
                </svg>
                <span className="flex-1 text-sm font-semibold">{g.name}</span>
                {logged && <span className={`text-xs tabular-nums ${got === g.list.length ? "text-gold" : "text-white/40"}`}>{got}/{g.list.length}</span>}
                {/* o que ainda falta ganhar (completo: o total, apagado) */}
                <Amount n={got === g.list.length ? sum(g.list) : sum(g.list.filter((a) => !have.has(a.code)))} dim={got === g.list.length} />
              </summary>
              <ul className="grid gap-1.5 px-3 pb-3 sm:grid-cols-2">
                {g.list.map((a) => {
                  const on = have.has(a.code);
                  return (
                    <li key={a.code} className={`flex items-center gap-2.5 rounded-xl px-3 py-2 ${on ? "bg-gold/10" : "bg-black/20"}`}>
                      <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${on ? "bg-gold text-stone-900" : "bg-white/5 text-white/30"}`}>
                        <AchievementIcon icon={a.icon} className="h-4 w-4" />
                      </span>
                      <span className="flex min-w-0 flex-1 flex-col leading-tight">
                        <span className={`truncate text-xs font-semibold ${on ? "text-white" : "text-white/70"}`}>{a.title}</span>
                        <span className="truncate text-[10px] text-white/40" title={a.desc}>
                          {a.desc}
                        </span>
                      </span>
                      <Amount n={achievementChips(a)} dim={on} />
                    </li>
                  );
                })}
              </ul>
            </details>
          );
        })}
      </section>
    </div>
  );
}
