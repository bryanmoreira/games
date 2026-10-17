import type { Metadata } from "next";
import { CARD, PageTitle, Stat, dayLabel } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin";
import { WINS_ONLY, pct, type DailyCell } from "@/lib/admin-rules";
import { getDailySummaries } from "@/lib/admin-stats";
import { DAILY_GAMES, dayNumber } from "@/lib/daily/challenge";
import { formatMs } from "@/lib/stats/compute";
import { GAME_INFO } from "@/lib/stats/games";

export const metadata: Metadata = { title: "Desafios" };

const WEEKDAY = new Intl.DateTimeFormat("pt-BR", { weekday: "short", timeZone: "UTC" });

function Cell({ c, winsOnly }: { c: DailyCell; winsOnly: boolean }) {
  if (!c.players) return <td className="px-3 py-2 text-center text-white/20">—</td>;
  const rate = pct(c.wins, c.plays);
  return (
    <td className="px-3 py-2">
      <div className="flex items-center justify-center gap-3 tabular-nums">
        <span className="flex items-center gap-1 text-white/90" title={winsOnly ? "Venceram" : "Jogaram"}>
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-white/40" fill="none" stroke="currentColor" strokeWidth={2.25} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="9" cy="8" r="4" />
            <path d="M2 21a7 7 0 0 1 14 0" />
          </svg>
          {c.players}
        </span>
        {/* Sudoku e Spider só guardam vitória: lá vale o tempo; no Verbete, quantos acertaram */}
        {winsOnly ? (
          <span className="w-12 text-xs text-white/50" title="Tempo médio">
            {c.avgMs !== null ? formatMs(c.avgMs) : "—"}
          </span>
        ) : (
          <span className={`w-12 text-xs ${rate === null ? "text-white/30" : rate >= 50 ? "text-emerald-300" : "text-orange-300"}`} title={`${c.wins} de ${c.plays} acertadas`}>
            {rate}%
          </span>
        )}
      </div>
    </td>
  );
}

export default async function AdminDailies() {
  await requireAdmin("/admin/desafios");
  const rows = await getDailySummaries();
  const today = rows[0];
  const verbete = (k: "plays" | "wins") => rows.reduce((a, r) => a + r.games.verbete[k], 0);

  return (
    <div className="flex flex-col gap-5">
      <PageTitle>Desafios</PageTitle>

      <div className="grid grid-cols-2 gap-2 sm:max-w-xl sm:grid-cols-4">
        {DAILY_GAMES.map((g) => (
          <Stat key={g} value={today?.games[g].players ?? 0} label={`${GAME_INFO[g].name} hoje`} />
        ))}
        <Stat value={`${pct(verbete("wins"), verbete("plays")) ?? 0}%`} label={`acertos Verbete ${rows.length}d`} />
      </div>

      {rows.length ? (
        <div className={`${CARD} overflow-x-auto`}>
          <table className="w-full min-w-[520px] text-sm">
            <thead>
              <tr className="border-b border-white/10 text-[11px] uppercase tracking-wider text-white/50">
                <th className="px-3 py-2.5 text-left font-normal">Dia</th>
                {DAILY_GAMES.map((g) => (
                  <th key={g} className="px-3 py-2.5 font-normal">
                    {GAME_INFO[g].name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {rows.map((r, i) => (
                <tr key={r.day} className={i === 0 ? "bg-gold/5" : undefined}>
                  <td className="whitespace-nowrap px-3 py-2">
                    <span className="font-display tabular-nums text-gold">#{dayNumber(r.day)}</span>
                    <span className="ml-2 tabular-nums text-white/70">{dayLabel(r.day)}</span>
                    <span className="ml-1.5 text-xs text-white/35">{WEEKDAY.format(new Date(`${r.day}T12:00:00Z`)).replace(".", "")}</span>
                  </td>
                  {DAILY_GAMES.map((g) => (
                    <Cell key={g} c={r.games[g]} winsOnly={WINS_ONLY.includes(g)} />
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="py-10 text-center text-sm text-white/40">Nenhum desafio ainda.</p>
      )}
    </div>
  );
}
