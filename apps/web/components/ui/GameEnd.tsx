"use client";

import { XIcon } from "./buttons";

/**
 * Tela de fim de partida de qualquer jogo (padrão do truco): 🏆 VITÓRIA! ou 💀 DERROTA,
 * um selo opcional (ex.: nível), os números do jogo como filhos e os botões ✕ sair + "De novo".
 * Jogos que podem empatar passam `draw` (🤝 EMPATE).
 * `actions` entra entre os dois (ex.: "Continuar" do Sudoku).
 */
export function GameEnd({
  won,
  draw,
  badge,
  children,
  onLeave,
  onAgain,
  againLabel = "De novo",
  busy,
  actions,
}: {
  won: boolean;
  draw?: boolean;
  badge?: React.ReactNode;
  children?: React.ReactNode;
  onLeave: () => void;
  onAgain?: () => void;
  againLabel?: string;
  busy?: boolean;
  actions?: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-3 backdrop-blur-sm">
      <div className="banner flex flex-col items-center gap-6 rounded-3xl bg-stone-900 px-5 py-8 ring-2 ring-gold/50 sm:px-10">
        <span className="text-6xl" aria-hidden="true">
          {draw ? "🤝" : won ? "🏆" : "💀"}
        </span>
        <div className="flex flex-col items-center gap-2">
          <h2 className={`font-display text-4xl ${draw ? "text-white" : won ? "text-gold" : "text-red-400"}`}>
            {draw ? "EMPATE" : won ? "VITÓRIA!" : "DERROTA"}
          </h2>
          {badge}
        </div>
        {children}
        <div className="flex flex-wrap justify-center gap-2 text-sm sm:gap-3 sm:text-base">
          <button onClick={onLeave} aria-label="Sair" title="Sair" className="flex items-center rounded-xl bg-white/10 px-4 py-3 sm:px-5 transition hover:bg-white/20">
            <XIcon />
          </button>
          {actions}
          {onAgain && (
            <button
              onClick={onAgain}
              disabled={busy}
              className="flex min-w-[6.5rem] items-center justify-center rounded-xl bg-gold px-4 py-3 sm:min-w-[7rem] sm:px-6 font-display text-stone-900 shadow-[0_4px_0_#9a6b12] active:translate-y-1 active:shadow-none"
            >
              {busy ? <span className="inline-block h-5 w-5 animate-spin rounded-full border-[3px] border-current border-r-transparent" aria-label="Gerando" /> : againLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/** Número com rótulo pequeno em cima, para os dados da partida na tela de fim. */
export function EndStat({ label, value, gold }: { label: string; value: React.ReactNode; gold?: boolean }) {
  return (
    <div className="flex flex-col items-center gap-1 font-display leading-none">
      <span className={`text-[10px] ${gold ? "text-gold/80" : "text-white/60"}`}>{label}</span>
      <span className={`text-3xl ${gold ? "text-gold" : ""}`}>{value}</span>
    </div>
  );
}
