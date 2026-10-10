import { DIFFICULTIES, type Difficulty, type Technique } from "@truco/sudoku";
import { LevelBars, LEVEL_LABEL, TECHNIQUE_LABEL } from "./common";

// ---------- mini grades dos exemplos ----------

/**
 * Casa do exemplo. `v` número; `n` anotações; `x` anotações riscadas.
 * `t`: "key" = as casas que explicam o truque, "hit" = casas onde algo sai, "ans" = a resposta, "dim" = de fora.
 */
type C = { v?: number; n?: number[]; x?: number[]; t?: "key" | "hit" | "ans" | "dim" } | null;

const TONE = {
  key: "bg-gold/25 ring-2 ring-inset ring-gold text-white",
  hit: "bg-red-500/15 ring-1 ring-inset ring-red-400/60 text-white",
  ans: "bg-gold text-stone-900",
  dim: "bg-felt/60 text-white/40",
  none: "bg-felt text-white",
};

function Ex({ rows, splitCol, splitRow }: { rows: C[][]; splitCol?: number; splitRow?: number }) {
  const cols = rows[0].length;
  return (
    <div className="grid w-fit gap-0.5" style={{ gridTemplateColumns: `repeat(${cols}, auto)` }}>
      {rows.flatMap((row, r) =>
        row.map((c, k) => {
          const gap = `${k === splitCol ? "ml-1.5" : ""} ${r === splitRow ? "mt-1.5" : ""}`;
          if (!c) return <span key={`${r}-${k}`} className={`h-9 w-9 sm:h-10 sm:w-10 ${gap}`} />;
          return (
            <span
              key={`${r}-${k}`}
              className={`flex h-9 w-9 items-center justify-center rounded-[4px] font-display text-base sm:h-10 sm:w-10 sm:text-lg ${TONE[c.t ?? "none"]} ${gap}`}
            >
              {c.v ?? (c.n && <Notes n={c.n} x={c.x ?? []} />)}
            </span>
          );
        }),
      )}
    </div>
  );
}

function Notes({ n, x }: { n: number[]; x: number[] }) {
  return (
    <span className="grid h-full w-full grid-cols-3 grid-rows-3 p-0.5 font-sans text-[9px] font-bold leading-none sm:text-[10px]">
      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => (
        <span key={d} className={`flex items-center justify-center ${x.includes(d) ? "rounded-[2px] bg-red-500 text-white line-through" : "text-white/85"}`}>
          {n.includes(d) ? d : ""}
        </span>
      ))}
    </span>
  );
}

const v = (n: number, t?: NonNullable<C>["t"]): C => ({ v: n, t });
const notes = (n: number[], t?: NonNullable<C>["t"], x?: number[]): C => ({ n, t, x });
const _ = null;

/** O 5 de fora bloqueia uma linha e uma coluna do bloco: só sobra uma casa. */
const HIDDEN: C[][] = [
  [v(1), v(8), { t: "hit" }, v(5, "dim")],
  [v(3), { t: "hit" }, v(9), _],
  [v(5, "ans"), v(2), v(6), _],
  [_, v(5, "dim"), _, _],
];

/** A linha e a coluna já têm todos os números menos o 6. */
const SINGLE: C[][] = [
  [_, _, v(5), _, _],
  [_, _, v(7), _, _],
  [v(1), v(2), v(6, "ans"), v(3), v(4)],
  [_, _, v(8), _, _],
  [_, _, v(9), _, _],
];

const PAIR: C[][] = [[notes([3, 7], "key"), notes([3, 7], "key"), notes([1, 3, 9], "hit", [3]), v(4), notes([7, 8], "hit", [7]), v(2), notes([3, 5], "hit", [3])]];

const POINTING: C[][] = [
  [notes([4, 6], "key"), v(9), notes([4, 6], "key"), notes([1, 4], "hit", [4]), v(5), notes([4, 7], "hit", [4])],
  [notes([2, 5]), v(1), v(3), _, _, _],
  [v(7), notes([2, 5]), v(8), _, _, _],
];

const XWING: C[][] = [
  [notes([2, 6], "key"), v(7), v(4), notes([2, 8], "key"), v(9)],
  [notes([2, 6], "hit", [2]), v(1), notes([2, 5]), notes([2, 3], "hit", [2]), v(8)],
  [v(6), v(3), v(9), notes([2, 4], "hit", [2]), notes([1, 2])],
  [notes([2, 3], "key"), v(8), v(1), notes([2, 6], "key"), v(5)],
];

// ---------- conteúdo ----------

const LEVELS: Record<Difficulty, { clues: string; text: string; tricks: Technique[] }> = {
  easy: { clues: "~38", text: "Sempre tem uma casa fácil de achar.", tricks: ["hidden", "single"] },
  medium: { clues: "~31", text: "Os mesmos truques, mas com menos pistas: é preciso procurar mais.", tricks: ["hidden", "single"] },
  hard: { clues: "~27", text: "Às vezes nenhuma casa sai direto. Anote as opções e use truques para riscar notas.", tricks: ["pair", "pointing"] },
  expert: { clues: "~26", text: "Pistas parecidas com o Difícil, mas exige truques que cruzam várias linhas.", tricks: ["triple", "xwing", "ywing"] },
};

function Chip({ t }: { t: Technique | string }) {
  return (
    <span className="whitespace-nowrap rounded-full bg-white/10 px-2 py-0.5 font-display text-[10px] text-gold">
      {t in TECHNIQUE_LABEL ? TECHNIQUE_LABEL[t as Technique] : t}
    </span>
  );
}

function Trick({ name, children, caption }: { name: string; children?: React.ReactNode; caption: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl bg-black/30 p-4">
      <Chip t={name} />
      {children}
      <p className="max-w-xs text-center text-xs text-white/70">{caption}</p>
    </div>
  );
}

function Group({ levels, children }: { levels: Difficulty[]; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-3 px-1 font-display text-xs text-white/60">
        {levels.map((l) => (
          <span key={l} className="flex items-center gap-1.5">
            <LevelBars level={l} className="h-3.5 w-4 text-gold" />
            {LEVEL_LABEL[l]}
          </span>
        ))}
      </div>
      <div className="grid gap-2 sm:grid-cols-2">{children}</div>
    </div>
  );
}

export function LevelList() {
  return (
    <div className="flex flex-col gap-2">
      {DIFFICULTIES.map((d) => (
        <div key={d} className="flex flex-col gap-2 rounded-2xl bg-black/30 px-4 py-3">
          <div className="flex items-center gap-3">
            <LevelBars level={d} className="h-5 w-6 shrink-0 text-gold" />
            <span className="font-display text-sm">{LEVEL_LABEL[d]}</span>
            <span className="ml-auto font-display text-[10px] text-white/50">{LEVELS[d].clues} PISTAS</span>
          </div>
          <p className="text-xs text-white/70">{LEVELS[d].text}</p>
          <div className="flex flex-wrap gap-1">
            {LEVELS[d].tricks.map((t) => (
              <Chip key={t} t={t === "hidden" ? "ÚNICO NO BLOCO" : t} />
            ))}
          </div>
        </div>
      ))}
      <p className="text-center text-xs text-white/60">Cada nível também usa os truques dos anteriores. A dica mostra o nome do truque que usou.</p>
    </div>
  );
}

export function Tricks() {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-center gap-3 text-[11px] text-white/60">
        <span className="flex items-center gap-1.5">
          <span className="h-3.5 w-3.5 rounded-[3px] bg-gold/25 ring-2 ring-inset ring-gold" /> explica
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3.5 w-3.5 rounded-[3px] bg-red-500" /> sai
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3.5 w-3.5 rounded-[3px] bg-gold" /> resposta
        </span>
      </div>

      <Group levels={["easy", "medium"]}>
        <Trick name="ÚNICO NO BLOCO" caption={<>Os <b>5</b> de fora bloqueiam uma linha e uma coluna do bloco. Só sobra uma casa para o <b>5</b>. Vale também para linha e coluna.</>}>
          <Ex rows={HIDDEN} splitCol={3} splitRow={3} />
        </Trick>
        <Trick name="single" caption={<>A linha e a coluna já têm todos os números, menos o <b>6</b>. Só ele cabe na casa.</>}>
          <Ex rows={SINGLE} />
        </Trick>
      </Group>

      <Group levels={["hard"]}>
        <Trick name="pair" caption={<>Duas casas da linha só aceitam <b>3</b> e <b>7</b>. Os dois ficam com elas, então saem das notas do resto da linha.</>}>
          <Ex rows={PAIR} />
        </Trick>
        <Trick name="pointing" caption={<>No bloco, o <b>4</b> só cabe na linha de cima. Então ele sai do resto dessa linha, fora do bloco.</>}>
          <Ex rows={POINTING} splitCol={3} />
        </Trick>
        <Trick name="claiming" caption="O contrário: na linha, o número só cabe dentro de um bloco. Ele sai das outras casas desse bloco." />
        <Trick name="hiddenPair" caption="Dois números que só cabem nas mesmas duas casas. As outras notas dessas casas saem." />
      </Group>

      <Group levels={["expert"]}>
        <Trick name="xwing" caption={<>Em duas linhas, o <b>2</b> só cabe nas mesmas duas colunas. Ele vai ficar num dos cantos, então sai do resto dessas colunas.</>}>
          <Ex rows={XWING} />
        </Trick>
        <Trick name="triple" caption="Igual ao par, com três casas que só aceitam os mesmos três números. Também existe a tripla oculta." />
        <Trick name="ywing" caption="Três casas com duas notas cada, ligadas em Y. O número que as duas pontas têm em comum sai das casas que veem as duas pontas." />
      </Group>
    </div>
  );
}
