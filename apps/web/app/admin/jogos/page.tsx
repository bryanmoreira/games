import type { Metadata } from "next";
import Link from "next/link";
import { CARD, Meter, PageTitle, Stat, Tabs, icon } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin";
import { WINS_ONLY, pct, type GameSummary } from "@/lib/admin-rules";
import { getGameSummaries, isPeriod, type Period } from "@/lib/admin-stats";
import { GAME_INFO, isSoloGame } from "@/lib/stats/games";

export const metadata: Metadata = { title: "Jogos" };

const PERIOD_TABS: [Period, string][] = [
  ["7", "7 dias"],
  ["30", "30 dias"],
  ["all", "Tudo"],
];

const MODES = [
  { key: "online", label: "Online", dot: "bg-emerald-400" },
  { key: "ai", label: "IA", dot: "bg-sky-400" },
  { key: "solo", label: "Solo", dot: "bg-gold" },
] as const;

function GameRow({ s, max }: { s: GameSummary; max: number }) {
  const solo = isSoloGame(s.game);
  const h = s.house;
  const played = h.win + h.loss + h.draw;
  const rate = pct(h.win, played);

  return (
    <li className={`${CARD} flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:gap-6`}>
      <div className="flex min-w-0 flex-col gap-1.5 sm:w-64">
        <div className="flex items-baseline justify-between gap-2">
          <Link href={GAME_INFO[s.game].path} className="truncate font-medium text-white transition hover:text-gold">
            {GAME_INFO[s.game].name}
          </Link>
          <span className="font-display tabular-nums text-gold" title="Partidas">
            {s.matches}
          </span>
        </div>
        {/* barra das partidas, dividida por modo */}
        <div className="flex h-1.5 overflow-hidden rounded-full bg-white/10" style={{ width: `${Math.max(4, (s.matches / max) * 100)}%` }}>
          {MODES.map((m) => (s.byMode[m.key] ? <div key={m.key} className={m.dot} style={{ flex: s.byMode[m.key] }} title={`${m.label} · ${s.byMode[m.key]}`} /> : null))}
        </div>
      </div>

      <div className="flex flex-1 flex-wrap items-center gap-x-5 gap-y-2 text-xs text-white/60">
        {MODES.map((m) =>
          s.byMode[m.key] ? (
            <span key={m.key} className="flex items-center gap-1.5 tabular-nums">
              <span className={`h-2 w-2 rounded-full ${m.dot}`} />
              {m.label} {s.byMode[m.key]}
            </span>
          ) : null,
        )}
        <span className="flex items-center gap-1 tabular-nums" title="Jogadores">
          {icon(
            <>
              <circle cx="9" cy="8" r="4" />
              <path d="M2 21a7 7 0 0 1 14 0" />
            </>,
          )}
          {s.players}
        </span>
      </div>

      {played > 0 && !WINS_ONLY.includes(s.game) && (
        <div className="flex w-full flex-col gap-1 sm:w-40" title={`${h.win} V · ${h.loss} D${h.draw ? ` · ${h.draw} E` : ""}`}>
          <div className="flex justify-between text-[11px] text-white/50">
            <span>{solo ? "vitórias" : "vence a IA"}</span>
            <span className="tabular-nums text-white/80">{rate}%</span>
          </div>
          <Meter value={rate} className={solo ? "bg-gold" : "bg-sky-400"} />
        </div>
      )}
    </li>
  );
}

export default async function AdminGames({ searchParams }: { searchParams: Promise<{ d?: string }> }) {
  await requireAdmin("/admin/jogos");
  const { d } = await searchParams;
  const period: Period = isPeriod(d) ? d : "30";
  const games = await getGameSummaries(period);
  const total = games.reduce((a, g) => a + g.matches, 0);
  const max = Math.max(1, ...games.map((g) => g.matches));
  const ai = games.filter((g) => !isSoloGame(g.game)).map((g) => g.house);
  const aiRate = pct(ai.reduce((a, h) => a + h.win, 0), ai.reduce((a, h) => a + h.win + h.loss + h.draw, 0));

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <PageTitle>Jogos</PageTitle>
        <Tabs items={PERIOD_TABS} active={period} href={(p) => (p === "30" ? "/admin/jogos" : `/admin/jogos?d=${p}`)} />
      </div>

      <div className="grid grid-cols-3 gap-2 sm:max-w-md">
        <Stat value={total} label="partidas" />
        <Stat value={games.length} label="jogos" />
        <Stat value={aiRate === null ? "—" : `${aiRate}%`} label="vence a IA" />
      </div>

      {games.length ? (
        <ul className="flex flex-col gap-2">
          {games.map((s) => (
            <GameRow key={s.game} s={s} max={max} />
          ))}
        </ul>
      ) : (
        <p className="py-10 text-center text-sm text-white/40">Nenhuma partida no período.</p>
      )}
    </div>
  );
}
