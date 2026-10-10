import type { Difficulty, HintReason, Technique } from "@truco/sudoku";

export const LEVEL_LABEL: Record<Difficulty, string> = {
  easy: "FÁCIL",
  medium: "MÉDIO",
  hard: "DIFÍCIL",
  expert: "EXPERT",
};

const LEVEL_N: Record<Difficulty, number> = { easy: 1, medium: 2, hard: 3, expert: 4 };

/** Barrinhas de dificuldade (1 a 4 acesas). */
export function LevelBars({ level, className = "h-4 w-5" }: { level: Difficulty; className?: string }) {
  const n = LEVEL_N[level];
  return (
    <svg viewBox="0 0 20 16" className={className} aria-hidden="true">
      {[0, 1, 2, 3].map((i) => (
        <rect key={i} x={i * 5 + 0.5} y={12 - i * 3.5} width={3.5} height={4 + i * 3.5} rx={1.2} fill="currentColor" opacity={i < n ? 1 : 0.25} />
      ))}
    </svg>
  );
}

export function formatTime(ms: number): string {
  const total = Math.floor(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return `${h ? `${h}:` : ""}${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

const UNIT_LABEL = { row: "ÚNICO NA LINHA", col: "ÚNICO NA COLUNA", box: "ÚNICO NO BLOCO" };

export const TECHNIQUE_LABEL: Record<Technique, string> = {
  single: "ÚNICO NA CASA",
  hidden: "ÚNICO",
  pointing: "LINHA APONTADA",
  claiming: "LINHA NO BLOCO",
  pair: "PAR",
  hiddenPair: "PAR OCULTO",
  triple: "TRIPLA",
  hiddenTriple: "TRIPLA OCULTA",
  xwing: "X-WING",
  ywing: "Y-WING",
};

export function reasonLabel(r: HintReason): string {
  if (r.kind === "wrong") return "CORRIGIDO";
  if (r.kind === "reveal") return "REVELADO";
  if (r.kind === "cell") return "ÚNICO NA CASA";
  return UNIT_LABEL[r.unit!.kind];
}

// tabuleiro de exemplo (resolvido) para ilustrações
export const SAMPLE = "534678912672195348198342567859761423426853791713924856961537284287419635345286179";
const SHOWN = "530070000600195000098000060800060003400803001700020006060000280000419005000080079";

/** Grade 9×9 de enfeite (página inicial e hub). */
export function MiniBoard({ className = "", digits = true }: { className?: string; digits?: boolean }) {
  return (
    <div className={`grid aspect-square grid-cols-3 gap-[3%] rounded-[6%] bg-[#5b3a1e] p-[3%] shadow-[0_6px_20px_rgba(0,0,0,0.5)] ${className}`}>
      {Array.from({ length: 9 }, (_, b) => (
        <div key={b} className="grid grid-cols-3 gap-px bg-[#0a3a24]">
          {Array.from({ length: 9 }, (_, k) => {
            const i = (Math.floor(b / 3) * 3 + Math.floor(k / 3)) * 9 + (b % 3) * 3 + (k % 3);
            const v = SHOWN[i] !== "0" ? SHOWN[i] : "";
            return (
              <div key={k} className="flex aspect-square items-center justify-center bg-felt font-display leading-none text-white/90 [font-size:inherit]">
                {digits ? v : ""}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
