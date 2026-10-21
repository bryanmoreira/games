"use client";

import { BISHOP, CLOCKS, FIFTY_LIMIT, fromFen, KING, KNIGHT, mFrom, mTo, PAWN, pseudoMoves, QUEEN, ROOK, squareOf as sq } from "@mesa/xadrez";
import { Section } from "@/components/ui/HowToSection";
import { BarsIcon } from "@/components/ui/icons";
import { StaticBoard, type Mark } from "./Board";
import { PieceShape } from "./Piece";
import { BulbIcon } from "./icons";
import { LEVEL_LABEL } from "./Settings";

type Marks = Partial<Record<number, Mark[]>>;
const marks = (list: [number, Mark][]): Marks => list.reduce<Marks>((m, [s, k]) => ((m[s] ??= []).push(k), m), {});

/** Casas para onde a peça em `from` anda (ponto) ou captura (anel). */
function movesOf(fen: string, from: string): Marks {
  const pos = fromFen(`${fen} w - - 0 1`);
  const list: [number, Mark][] = [[sq(from), "selected"]];
  for (const m of pseudoMoves(pos)) if (mFrom(m) === sq(from)) list.push([mTo(m), pos.board[mTo(m)] ? "capture" : "target"]);
  return marks(list);
}

const PIECES: { p: number; name: string; fen: string; from: string; note: string }[] = [
  { p: KING, name: "REI", fen: "8/8/8/8/3K4/8/8/8", from: "d4", note: "1 casa" },
  { p: QUEEN, name: "DAMA", fen: "8/8/8/8/3Q4/8/8/8", from: "d4", note: "linha e diagonal" },
  { p: ROOK, name: "TORRE", fen: "8/8/8/8/3R4/8/8/8", from: "d4", note: "linha reta" },
  { p: BISHOP, name: "BISPO", fen: "8/8/8/8/3B4/8/8/8", from: "d4", note: "diagonal" },
  { p: KNIGHT, name: "CAVALO", fen: "8/8/8/8/3N4/8/8/8", from: "d4", note: "em L, pula" },
  { p: PAWN, name: "PEÃO", fen: "8/8/8/8/8/3p4/4P3/8", from: "e2", note: "frente, captura na diagonal" },
];

function Arrow() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6 shrink-0 text-white/50" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 12h15M13 6l6 6-6 6" />
    </svg>
  );
}

/** Antes → depois de um lance especial. */
function BeforeAfter({ label, before, after, m1, m2 }: { label: string; before: string; after: string; m1: Marks; m2: Marks }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex items-center gap-1.5">
        <StaticBoard fen={before} marks={m1} className="w-[7.5rem] sm:w-40" />
        <Arrow />
        <StaticBoard fen={after} marks={m2} className="w-[7.5rem] sm:w-40" />
      </div>
      <span className="font-display text-[10px] tracking-wider text-white/60">{label}</span>
    </div>
  );
}

/** Regras ilustradas do xadrez (página "Como jogar" e janela dentro da partida). */
export function HowToPlay() {
  return (
    <>
      <Section n={1} title="Objetivo">
        <div className="flex items-center justify-center gap-4 font-display">
          <Side p={KING} name="Começa" />
          <span className="text-white/40">×</span>
          <Side p={-KING} name="Responde" />
        </div>
        <p className="text-center text-sm text-white/70">
          Dê <b className="text-white">xeque-mate</b>: ataque o rei adversário de um jeito que ele não tenha como escapar. As brancas começam e as cores trocam a
          cada partida.
        </p>
      </Section>

      <Section n={2} title="As peças">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5">
          {PIECES.map((x) => (
            <div key={x.name} className="flex flex-col items-center gap-1.5">
              <StaticBoard fen={x.fen} marks={movesOf(x.fen, x.from)} className="w-full max-w-40" />
              <span className="flex items-center gap-1 font-display text-xs tracking-wider">
                <PieceShape p={x.p} className="h-5 w-5" />
                {x.name}
              </span>
              <span className="text-center text-[11px] leading-tight text-white/60">{x.note}</span>
            </div>
          ))}
        </div>
        <ul className="mx-auto flex max-w-md flex-col gap-1.5 text-sm text-white/70">
          <li>Só o cavalo pula peças. Captura é parar na casa de uma peça adversária.</li>
          <li>
            O peão anda <b className="text-white">2 casas</b> no primeiro lance e nunca anda para trás.
          </li>
        </ul>
      </Section>

      <Section n={3} title="Xeque e mate">
        <div className="flex items-center justify-center gap-3 sm:gap-6">
          <StaticBoard fen="6k1/5ppp/8/8/8/8/8/3R2K1" marks={marks([[sq("d1"), "selected"], [sq("d8"), "target"]])} className="w-[7.5rem] sm:w-40" />
          <Arrow />
          <StaticBoard fen="3R2k1/5ppp/8/8/8/8/8/6K1" marks={marks([[sq("d1"), "last"], [sq("d8"), "last"], [sq("g8"), "check"]])} className="w-[7.5rem] sm:w-40" />
        </div>
        <p className="text-center text-sm text-white/70">
          Rei atacado está em <b className="text-white">xeque</b> e precisa sair dele. Sem saída, é <b className="text-gold">mate</b>. Nunca dá para deixar o próprio
          rei em xeque.
        </p>
      </Section>

      <Section n={4} title="Lances especiais">
        <div className="flex flex-col items-center gap-4">
          <BeforeAfter
            label="ROQUE"
            before="8/8/8/8/8/8/5PPP/4K2R"
            after="8/8/8/8/8/8/5PPP/5RK1"
            m1={marks([[sq("e1"), "selected"], [sq("g1"), "target"]])}
            m2={marks([[sq("g1"), "last"], [sq("f1"), "last"]])}
          />
          <BeforeAfter
            label="EN PASSANT"
            before="8/8/8/3pP3/8/8/8/8"
            after="8/8/3P4/8/8/8/8/8"
            m1={marks([[sq("e5"), "selected"], [sq("d6"), "target"], [sq("d5"), "last"]])}
            m2={marks([[sq("e5"), "last"], [sq("d6"), "last"]])}
          />
          <BeforeAfter
            label="PROMOÇÃO"
            before="8/4P3/8/8/8/8/8/8"
            after="4Q3/8/8/8/8/8/8/8"
            m1={marks([[sq("e7"), "selected"], [sq("e8"), "target"]])}
            m2={marks([[sq("e7"), "last"], [sq("e8"), "last"]])}
          />
        </div>
        <ul className="mx-auto flex max-w-md flex-col gap-1.5 text-sm text-white/70">
          <li>
            <b className="text-white">Roque:</b> rei e torre sem ter andado, nada entre eles, rei fora de xeque e sem passar por casa atacada.
          </li>
          <li>
            <b className="text-white">En passant:</b> o peão que andou 2 casas e parou ao lado do seu pode ser capturado como se tivesse andado 1, só no lance
            seguinte.
          </li>
          <li>
            <b className="text-white">Promoção:</b> o peão que chega ao fim vira dama, torre, bispo ou cavalo.
          </li>
        </ul>
      </Section>

      <Section n={5} title="Empate">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Draw big="0" text="lances sem estar em xeque (afogado)" />
          <Draw big="3×" text="a mesma posição" />
          <Draw big={String(FIFTY_LIMIT / 2)} text="lances de cada lado sem captura nem peão" />
          <Draw big="½" text="sem peças para dar mate, ou combinado entre os dois" />
        </div>
      </Section>

      <Section n={6} title="Relógio">
        <div className="flex flex-wrap justify-center gap-2 font-display text-sm">
          {CLOCKS.filter((c) => c !== "none").map((c) => (
            <span key={c} className="rounded-full bg-white/10 px-3 py-1">
              {c}
            </span>
          ))}
        </div>
        <p className="text-center text-sm text-white/70">
          Opcional: minutos de cada um + segundos ganhos a cada lance. Quem fica <b className="text-white">sem tempo perde</b> (empata se o outro só tiver o rei).
        </p>
      </Section>

      <Section n={7} title="Contra a IA">
        <div className="flex flex-wrap justify-center gap-2 font-display text-sm">
          {Object.values(LEVEL_LABEL).map((l) => (
            <span key={l} className="rounded-full bg-white/10 px-3 py-1">
              {l}
            </span>
          ))}
        </div>
        <div className="flex items-center justify-center gap-6 text-sm text-white/70">
          <span className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-black/35 text-white/80">
              <BulbIcon />
            </span>
            mostra um bom lance
          </span>
          <span className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gold/20 text-gold">
              <BarsIcon className="h-4 w-4" />
            </span>
            barra de vantagem
          </span>
        </div>
      </Section>
    </>
  );
}

function Side({ p, name }: { p: number; name: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <PieceShape p={p} className={`h-14 w-14 ${p < 0 ? "drop-shadow-[0_0_6px_rgba(242,193,78,0.45)]" : ""}`} />
      <span className="text-[10px] tracking-wider text-white/60">{name.toUpperCase()}</span>
    </div>
  );
}

function Draw({ big, text }: { big: string; text: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-black/30 px-4 py-3">
      <span className="font-display text-3xl text-gold">{big}</span>
      <span className="text-sm leading-tight text-white/70">{text}</span>
    </div>
  );
}
