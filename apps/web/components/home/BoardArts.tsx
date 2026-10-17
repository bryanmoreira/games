"use client";

import { fromFen } from "@truco/xadrez";
import { Board as Connect4Board } from "@/components/connect4/Board";
import { Board as DamasBoard } from "@/components/damas/Board";
import { Board as VelhaBoard, type Piece as VelhaPiece } from "@/components/jogo-da-velha/Board";
import { Board as LudoBoard, type UiPiece as LudoPiece } from "@/components/ludo/Board";
import { Board as OtrioBoard, type Piece as OtrioPiece } from "@/components/otrio/Board";
import { Board as ChessBoard } from "@/components/xadrez/Board";
import { useSequence } from "./HoverCard";

// Arte dos tabuleiros na home: parada mostra a posição de sempre; com o mouse em cima, joga os lances até ela.

type Tracked = { id: number; sq: number; p: number };

/** Peças de cada posição com `id` estável: quem mudou de casa desliza; quem sumiu foi capturado. */
function track(boards: number[][]): Tracked[][] {
  let prev: Tracked[] = boards[0].flatMap((p, sq) => (p ? [{ id: sq, sq, p }] : []));
  const out = [prev];
  for (const next of boards.slice(1)) {
    const stay = prev.filter((pc) => next[pc.sq] === pc.p);
    const taken = new Set(stay.map((pc) => pc.sq));
    const free = prev.filter((pc) => !stay.includes(pc));
    const moved = next.flatMap((p, sq) => {
      if (!p || taken.has(sq)) return [];
      const i = free.findIndex((pc) => pc.p === p);
      return i < 0 ? [] : [{ ...free.splice(i, 1)[0], sq }];
    });
    prev = [...stay, ...moved];
    out.push(prev);
  }
  return out;
}

// ---------- Connect 4: três peças caem e fecham a diagonal ----------

const C4_BASE: { col: number; row: number; seat: 0 | 1 }[] = [
  { col: 0, row: 0, seat: 0 },
  { col: 1, row: 0, seat: 1 },
  { col: 2, row: 0, seat: 1 },
  { col: 3, row: 0, seat: 0 },
  { col: 4, row: 0, seat: 1 },
  { col: 5, row: 0, seat: 0 },
  { col: 1, row: 1, seat: 0 },
  { col: 2, row: 1, seat: 1 },
  { col: 3, row: 1, seat: 1 },
  { col: 3, row: 2, seat: 1 },
];
const C4_DROPS: typeof C4_BASE = [
  { col: 5, row: 1, seat: 1 },
  { col: 2, row: 2, seat: 0 },
  { col: 3, row: 3, seat: 0 },
];
const C4_WIN = [0, 1, 2, 3].map((i) => ({ col: i, row: i }));

export function Connect4Art() {
  const { step, played } = useSequence(C4_DROPS.length + 1, [250, 450, 450]);
  const last = step === C4_DROPS.length;
  return (
    <Connect4Board
      moves={[...C4_BASE, ...C4_DROPS.slice(0, step)]}
      color={(s) => (s === 0 ? "gold" : "red")}
      animateFrom={played ? C4_BASE.length : Infinity}
      winLine={last ? C4_WIN : null}
      dim={false}
    />
  );
}

// ---------- Jogo da Velha: a partida riscada lance a lance ----------

const VELHA_MOVES: VelhaPiece[] = [
  { cell: 0, mark: "X", ink: "gold" },
  { cell: 1, mark: "O", ink: "red" },
  { cell: 4, mark: "X", ink: "gold" },
  { cell: 3, mark: "O", ink: "red" },
  { cell: 8, mark: "X", ink: "gold" },
];

export function VelhaArt() {
  const n = VELHA_MOVES.length + 1;
  const { step, played } = useSequence(n, 320);
  // tirar as peças e pôr de novo é o que risca de novo (o traço anima ao entrar)
  return <VelhaBoard pieces={VELHA_MOVES.slice(0, step).map((p) => ({ ...p, draw: played }))} winLine={step === n - 1 ? [0, 4, 8] : null} />;
}

// ---------- Xadrez: a abertura italiana ----------

const CHESS = track(
  [
    "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR",
    "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR",
    "rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR",
    "rnbqkbnr/pppp1ppp/8/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R",
    "r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R",
    "r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R",
    "r1bqk1nr/pppp1ppp/2n5/2b1p3/2B1P3/5N2/PPPP1PPP/RNBQK2R",
  ].map((fen) => [...fromFen(`${fen} w - - 0 1`).board]),
);

export function ChessArt() {
  const { step } = useSequence(CHESS.length, [420, 380]);
  return <ChessBoard pieces={CHESS[step]} coords={false} />;
}

// ---------- Damas: duas capturas seguidas ----------

const DAMAS_ROWS = [
  ["", "..b.B...", ".b...b..", "........", "...b.W..", "w.w.....", ".w......"],
  ["", "..b.B...", ".b...b..", "....w...", ".....W..", "w.......", ".w......"],
  ["", "..b.B...", ".b......", "....w.b.", ".....W..", "w.......", ".w......"],
  ["", "..b.B...", ".b.....W", "....w...", "........", "w.......", ".w......"],
];
const DAMAS_VALUE: Record<string, number> = { w: 1, W: 2, b: -1, B: -2 };
const DAMAS = track(DAMAS_ROWS.map((rows) => [...rows, ...Array(8 - rows.length).fill("")].flatMap((r: string) => [...r.padEnd(8, ".")].map((c) => DAMAS_VALUE[c] ?? 0))));

export function DamasArt() {
  const { step } = useSequence(DAMAS.length, [250, 550, 450]);
  return <DamasBoard pieces={DAMAS[step]} step={320} />;
}

// ---------- Ludo: o peão azul anda seis casas ----------

const LUDO_REST: LudoPiece[] = [
  { color: 0, piece: 0, progress: 7 },
  { color: 2, piece: 0, progress: 18 },
  { color: 3, piece: 0, progress: 52 },
  { color: 0, piece: 1, progress: 56 },
];
const LUDO_FROM = 3;
const LUDO_STEPS = 6;

export function LudoArt() {
  const { step } = useSequence(LUDO_STEPS + 1, [300, 170]);
  return <LudoBoard pieces={[...LUDO_REST, { color: 1, piece: 0, progress: LUDO_FROM + step }]} step={160} />;
}

// ---------- Otrio: os três anéis vermelhos encaixam no meio ----------

const OTRIO_CELLS = ["r..", "..b", "..g", ".p.", "", "", "p..", "b..", ".g."];
const OTRIO_REST: OtrioPiece[] = OTRIO_CELLS.flatMap((s, cell) => [...s].flatMap((ch, size) => ("rbgp".indexOf(ch) >= 0 ? [{ slot: cell * 3 + size, color: "rbgp".indexOf(ch) }] : [])));
const OTRIO_DROPS: OtrioPiece[] = [14, 13, 12].map((slot) => ({ slot, color: 0 }));

export function OtrioArt() {
  const { step, played } = useSequence(OTRIO_DROPS.length + 1, [250, 380, 380]);
  return (
    <OtrioBoard
      pieces={[...OTRIO_REST, ...OTRIO_DROPS.slice(0, step)]}
      animateFrom={played ? OTRIO_REST.length : Infinity}
      win={step === OTRIO_DROPS.length ? [12, 13, 14] : null}
      dim={false}
    />
  );
}
