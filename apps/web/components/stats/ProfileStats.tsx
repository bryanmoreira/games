import Link from "next/link";
import { AchievementIcon } from "@/components/stats/AchievementIcon";
import { ACHIEVEMENTS, type AchievementDef } from "@/lib/stats/achievements";
import { GAME_INFO, STAT_GAMES } from "@/lib/stats/games";
import type { GameStats, ModeStats, ProfileStats, Rivalry } from "@/lib/stats/summary";

const CARD = "rounded-2xl bg-white/5 ring-1 ring-white/10";

function Flame({ className = "h-4 w-4" }: { className?: string }) {
  return <AchievementIcon icon="flame" className={className} />;
}

/** Barra de vitórias (verde), empates (cinza) e derrotas (vermelho). */
function WinBar({ m }: { m: ModeStats }) {
  const w = (n: number) => `${(n / m.games) * 100}%`;
  return (
    <div className="flex h-2 w-full overflow-hidden rounded-full bg-white/10" aria-hidden="true">
      <div className="bg-emerald-400" style={{ width: w(m.wins) }} />
      <div className="bg-white/30" style={{ width: w(m.draws) }} />
      <div className="bg-red-400/80" style={{ width: w(m.losses) }} />
    </div>
  );
}

function ModeRow({ label, m }: { label: string; m: ModeStats }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-3 text-sm">
        <span className="text-white/50">{label}</span>
        <span className="flex items-baseline gap-2 tabular-nums">
          <span className="text-emerald-300">{m.wins} V</span>
          {m.draws > 0 && <span className="text-white/50">{m.draws} E</span>}
          <span className="text-red-300">{m.losses} D</span>
          <span className="w-11 text-right font-display text-gold">{m.pct}%</span>
        </span>
      </div>
      <WinBar m={m} />
      {(m.streak >= 2 || m.bestStreak >= 2) && (
        <div className="flex gap-3 text-xs text-white/45">
          {m.streak >= 2 && (
            <span className="flex items-center gap-1 text-orange-300">
              <Flame className="h-3.5 w-3.5" />
              {m.streak} seguidas
            </span>
          )}
          {m.bestStreak >= 2 && <span>Recorde: {m.bestStreak} seguidas</span>}
        </div>
      )}
    </div>
  );
}

function GameCard({ s }: { s: GameStats }) {
  const info = GAME_INFO[s.game];
  return (
    <div className={`${CARD} flex flex-col gap-4 p-4 sm:p-5`}>
      <div className="flex items-center justify-between gap-3">
        <Link href={info.path} className="font-display text-lg text-gold transition hover:brightness-125">
          {info.name.toUpperCase()}
        </Link>
        {!s.modes.online && !s.modes.ai && (
          <span className="text-sm tabular-nums text-white/60">
            {s.wins} vitória{s.wins === 1 ? "" : "s"}
          </span>
        )}
      </div>

      {s.modes.online && <ModeRow label="Online" m={s.modes.online} />}
      {s.modes.ai && <ModeRow label="Contra IA" m={s.modes.ai} />}

      {s.chips.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {s.chips.map((c) => (
            <span key={c.label} className="flex items-baseline gap-1.5 rounded-full bg-black/25 px-3 py-1 text-xs">
              <span className="text-white/45">{c.label}</span>
              <span className="font-semibold text-white/90">{c.value}</span>
            </span>
          ))}
        </div>
      )}

      {s.table && (
        <div className="-mx-1 overflow-x-auto">
          <table className="w-full min-w-[280px] text-sm">
            <thead>
              <tr className="text-xs text-white/40">
                <th className="px-1 pb-2 text-left font-normal" />
                {s.table.cols.map((c) => (
                  <th key={c} className="px-1 pb-2 text-right font-normal">
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {s.table.rows.map((r) => (
                <tr key={r.label} className="border-t border-white/5">
                  <td className="px-1 py-1.5 text-white/60">{r.label}</td>
                  {r.values.map((v, i) => (
                    <td key={i} className={`px-1 py-1.5 text-right tabular-nums ${v && v !== "0" ? (i === 1 ? "text-gold" : "text-white/90") : "text-white/25"}`}>
                      {v ?? "--"}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function AchievementCard({ def, at, detailed }: { def: AchievementDef; at?: Date; detailed?: boolean }) {
  return (
    <div
      title={`${def.desc}${at ? ` · ${at.toLocaleDateString("pt-BR")}` : ""}`}
      className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 ring-1 ${at ? "bg-gold/10 ring-gold/30" : "bg-white/[0.03] ring-white/5"}`}
    >
      <span className={`flex shrink-0 items-center justify-center rounded-full ${detailed ? "h-10 w-10" : "h-8 w-8"} ${at ? "bg-gold text-stone-900" : "bg-white/5 text-white/20"}`}>
        <AchievementIcon icon={def.icon} className={detailed ? "h-5 w-5" : "h-4 w-4"} />
      </span>
      <span className="flex min-w-0 flex-col leading-tight">
        <span className={`truncate text-xs font-semibold ${at ? "text-white" : "text-white/35"}`}>{def.title}</span>
        <span className="truncate text-[10px] text-white/35">{detailed ? def.desc : def.game ? GAME_INFO[def.game].name : "Geral"}</span>
        {detailed && at && <span className="mt-0.5 text-[10px] text-gold/70">{at.toLocaleDateString("pt-BR")}</span>}
      </span>
    </div>
  );
}

/** Conquistas desbloqueadas (perfil público, abaixo dos números). */
function UnlockedAchievements({ stats }: { stats: ProfileStats }) {
  if (!stats.achievements.length) return null;
  return (
    <section className="flex flex-col gap-3">
      <h2 className="flex items-center justify-between font-display text-sm text-white/80">
        CONQUISTAS
        <span className="text-xs text-white/40">
          {stats.achievements.length}/{ACHIEVEMENTS.length}
        </span>
      </h2>
      <div className="grid grid-cols-2 gap-2 @xl:grid-cols-3 @4xl:grid-cols-4">
        {stats.achievements.map((a) => (
          <AchievementCard key={a.def.code} def={a.def} at={a.unlockedAt} />
        ))}
      </div>
    </section>
  );
}

/** Página de conquistas do próprio jogador: progresso e todas, agrupadas por jogo (as que faltam apagadas). */
export function AchievementsView({ stats }: { stats: ProfileStats }) {
  const have = new Map(stats.achievements.map((a) => [a.def.code, a.unlockedAt]));
  const groups: { key: string; name: string; list: AchievementDef[] }[] = [
    { key: "geral", name: "Geral", list: ACHIEVEMENTS.filter((a) => a.game === null) },
    ...STAT_GAMES.map((g) => ({ key: g, name: GAME_INFO[g].name, list: ACHIEVEMENTS.filter((a) => a.game === g) })),
  ].filter((g) => g.list.length);
  const done = stats.achievements.length;
  const pct = Math.round((done / ACHIEVEMENTS.length) * 100);

  return (
    <div className="@container flex flex-col gap-6">
      <div className={`${CARD} flex items-center gap-4 p-4 sm:p-5`}>
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gold text-stone-900">
          <AchievementIcon icon="trophy" className="h-6 w-6" />
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <div className="flex items-baseline justify-between font-display">
            <span className="text-2xl text-gold">
              {done}
              <span className="text-base text-white/40">/{ACHIEVEMENTS.length}</span>
            </span>
            <span className="text-sm text-white/60">{pct}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-gold" style={{ width: `${pct}%` }} />
          </div>
        </div>
      </div>

      {groups.map((g) => {
        const got = g.list.filter((a) => have.has(a.code)).length;
        return (
          <section key={g.key} className="flex flex-col gap-3">
            <h2 className="flex items-center justify-between font-display text-sm text-white/80">
              {g.name.toUpperCase()}
              <span className={`text-xs ${got === g.list.length ? "text-gold" : "text-white/40"}`}>
                {got}/{g.list.length}
              </span>
            </h2>
            <div className="grid gap-2 @xl:grid-cols-2 @4xl:grid-cols-3">
              {/* conquistadas primeiro */}
              {[...g.list].sort((a, b) => Number(have.has(b.code)) - Number(have.has(a.code))).map((a) => (
                <AchievementCard key={a.code} def={a} at={have.get(a.code)} detailed />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

/** Números do jogador. `achievements`: mostra também as conquistas (perfil público; o próprio perfil tem página delas). */
export function ProfileStatsView({ stats, achievements = true }: { stats: ProfileStats; achievements?: boolean }) {
  return (
    <div className="@container flex flex-col gap-6">
      {stats.games.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <span className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm ring-1 ${stats.days.current > 0 ? "bg-orange-400/10 text-orange-200 ring-orange-400/30" : "bg-white/5 text-white/50 ring-white/10"}`}>
            <Flame />
            {stats.days.current} dia{stats.days.current === 1 ? "" : "s"} seguido{stats.days.current === 1 ? "" : "s"}
          </span>
          {stats.days.best > 1 && <span className="flex items-center rounded-full bg-white/5 px-4 py-2 text-sm text-white/50 ring-1 ring-white/10">Recorde: {stats.days.best} dias</span>}
        </div>
      )}

      {stats.games.length > 0 ? (
        <div className="grid gap-3 @xl:grid-cols-2 @5xl:grid-cols-3">
          {stats.games.map((g) => (
            <GameCard key={g.game} s={g} />
          ))}
        </div>
      ) : (
        <div className={`${CARD} flex flex-col items-center gap-3 px-4 py-10 text-white/35`}>
          <AchievementIcon icon="trophy" className="h-10 w-10" />
          <span className="font-display text-sm">NENHUMA PARTIDA AINDA</span>
        </div>
      )}

      {achievements && <UnlockedAchievements stats={stats} />}
    </div>
  );
}

/** Placar entre quem está vendo e o dono do perfil. */
export function RivalryCard({ rivalry, them }: { rivalry: Rivalry; them: string }) {
  if (!rivalry.games.length) return null;
  const lead = rivalry.me > rivalry.them ? "me" : rivalry.them > rivalry.me ? "them" : null;
  return (
    <section className={`${CARD} flex flex-col gap-4 p-4 sm:p-5`}>
      <h2 className="flex items-center gap-2 font-display text-sm text-white/80">
        <svg viewBox="0 0 24 24" className="h-4 w-4 text-gold" fill="none" stroke="currentColor" strokeWidth={2.25} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M14.5 17.5 3 6V3h3l11.5 11.5M13 19l6-6M16 16l4 4M19 21l2-2" />
          <path d="M9.5 6.5 21 18v3h-3l-1-1M5 14l-2 2 2 2M3 21l2-2" />
        </svg>
        RIVALIDADE
      </h2>
      <div className="flex items-center justify-center gap-4 font-display">
        <span className="flex flex-col items-center">
          <span className={`text-4xl tabular-nums ${lead === "me" ? "text-gold" : "text-white/80"}`}>{rivalry.me}</span>
          <span className="text-[10px] text-white/45">VOCÊ</span>
        </span>
        <span className="text-2xl text-white/25">×</span>
        <span className="flex flex-col items-center">
          <span className={`text-4xl tabular-nums ${lead === "them" ? "text-gold" : "text-white/80"}`}>{rivalry.them}</span>
          <span className="max-w-28 truncate text-[10px] text-white/45">@{them.toUpperCase()}</span>
        </span>
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        {rivalry.games.map((g) => (
          <span key={g.game} className="flex items-baseline gap-1.5 rounded-full bg-black/25 px-3 py-1 text-xs">
            <span className="text-white/45">{GAME_INFO[g.game].name}</span>
            <span className="font-semibold tabular-nums text-white/90">
              {g.me} × {g.them}
            </span>
          </span>
        ))}
      </div>
    </section>
  );
}
