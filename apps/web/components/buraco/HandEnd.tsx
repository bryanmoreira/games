"use client";

import type { HandResult, Team, TeamScore } from "@mesa/buraco";

const sign = (n: number) => (n > 0 ? `+${n}` : String(n));

/** Linhas da conta da mão (só as que mudam alguma coisa). */
function rows(mine: TeamScore, theirs: TeamScore) {
  const can = (s: TeamScore) =>
    [s.canastras.real && `${s.canastras.real} real`, s.canastras.limpa && `${s.canastras.limpa} limpa`, s.canastras.suja && `${s.canastras.suja} suja`].filter(Boolean).join(" · ");
  return [
    { label: "MESA", a: mine.table, b: theirs.table, show: true },
    { label: "CANASTRAS", a: mine.bonus, b: theirs.bonus, show: mine.bonus > 0 || theirs.bonus > 0, note: [can(mine), can(theirs)] },
    { label: "BATIDA", a: mine.batida, b: theirs.batida, show: mine.batida > 0 || theirs.batida > 0 },
    { label: "NA MÃO", a: mine.hand, b: theirs.hand, show: true },
    { label: "MORTO", a: mine.morto, b: theirs.morto, show: mine.morto < 0 || theirs.morto < 0 },
  ].filter((r) => r.show);
}

/** Conta da mão que acabou, com o placar da partida; a barra mostra o tempo até a próxima. */
export function HandEnd({
  result,
  myTeam,
  scores,
  target,
  duo,
  nextMs,
  who,
}: {
  result: HandResult;
  myTeam: Team;
  scores: [number, number];
  target: number;
  duo: boolean;
  nextMs: number;
  /** Nome de quem bateu. */
  who: string;
}) {
  const mine = result.scores[myTeam];
  const theirs = result.scores[1 - myTeam];
  const ours = result.team === myTeam;
  const title = result.kind === "batida" ? (ours ? "BATIDA!" : "BATERAM") : "ACABOU O MONTE";
  return (
    <div className="pointer-events-none fixed inset-0 z-40 flex items-center justify-center bg-black/55 p-3">
      <div className="banner flex w-full max-w-sm flex-col items-center gap-3 rounded-3xl bg-stone-900/95 px-4 py-5 ring-2 ring-gold/40 sm:px-6">
        <div className="flex flex-col items-center leading-none">
          <span className={`font-display text-3xl ${result.team === null ? "text-white" : ours ? "text-gold" : "text-red-400"}`}>{title}</span>
          {result.kind === "batida" && <span className="mt-1 font-display text-xs text-white/60">{who}</span>}
        </div>
        <div className="grid w-full grid-cols-[1fr_auto_auto] items-center gap-x-4 gap-y-1.5 font-display text-sm">
          <span />
          <span className="w-16 text-right text-xs text-gold/80">{duo ? "NÓS" : "VOCÊ"}</span>
          <span className="w-16 text-right text-xs text-white/60">{duo ? "ELES" : "ELE"}</span>
          {rows(mine, theirs).map((r) => (
            <div key={r.label} className="contents">
              <span className="text-xs text-white/60">
                {r.label}
                {r.note && (r.note[0] || r.note[1]) && (
                  <span className="block text-[10px] normal-case text-white/40">
                    {r.note[0] || "—"} <span className="text-white/25">|</span> {r.note[1] || "—"}
                  </span>
                )}
              </span>
              <span className={`w-16 text-right ${r.a < 0 ? "text-red-300" : "text-white"}`}>{sign(r.a)}</span>
              <span className={`w-16 text-right ${r.b < 0 ? "text-red-300" : "text-white/80"}`}>{sign(r.b)}</span>
            </div>
          ))}
          <div className="col-span-3 h-px bg-white/10" />
          <span className="text-xs text-white/60">MÃO</span>
          <span className={`w-16 text-right text-xl ${mine.total < 0 ? "text-red-300" : "text-gold"}`}>{sign(mine.total)}</span>
          <span className={`w-16 text-right text-xl ${theirs.total < 0 ? "text-red-300" : "text-white"}`}>{sign(theirs.total)}</span>
        </div>
        <div className="flex w-full flex-col items-center gap-1 rounded-2xl bg-black/30 px-3 py-2 font-display">
          <span className="text-[10px] tracking-widest text-white/50">PLACAR · ATÉ {target}</span>
          <p className="text-3xl leading-none">
            <span className="text-gold">{scores[myTeam]}</span>
            <span className="mx-3 text-base text-white/30">×</span>
            {scores[1 - myTeam]}
          </p>
        </div>
        <div className="h-1 w-full overflow-hidden rounded-full bg-white/10" aria-hidden="true">
          <div className="hand-end-bar h-full rounded-full bg-gold/70" style={{ animationDuration: `${nextMs}ms` }} />
        </div>
      </div>
    </div>
  );
}
