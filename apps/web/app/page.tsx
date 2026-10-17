import type { Metadata } from "next";
import type { CSSProperties, ReactNode } from "react";
import Link from "next/link";
import { JsonLd } from "@/components/seo";
import { SITE_TAGLINE, getGame, homeLd } from "@/lib/seo";
import { makeCard } from "@truco/game";
import { CardImg } from "@/components/cards/Card";
import { MiniBoard } from "@/components/sudoku/common";
import { MiniTiles } from "@/components/verbete/Tile";
import { StaticBoard } from "@/components/connect4/Board";
import { StopLogo } from "@/components/stop/Tile";
import { SeaLogo } from "@/components/batalha-naval/Sea";
import { MiniGrid } from "@/components/codenames/Board";
import { StaticBoard as OtrioBoard } from "@/components/otrio/Board";
import { StaticBoard as VelhaBoard } from "@/components/jogo-da-velha/Board";
import { StaticBoard as DamasBoard } from "@/components/damas/Board";
import { StaticBoard as LudoBoard } from "@/components/ludo/Board";
import { StaticBoard as ChessBoard } from "@/components/xadrez/Board";
import { FieldArt } from "@/components/futebol-de-botao/Field";
import { Domino } from "@/components/domino/Tile";
import { UserButton } from "@/components/UserButton";
import { GameGrid, type GameTile } from "@/components/home/GameGrid";
import { SiteFooter } from "@/components/SiteFooter";
import { TableDecor } from "@/components/home/TableDecor";

const TRUCO_FAN = [makeCard("4", "clubs"), makeCard("7", "hearts"), makeCard("A", "spades")];
const SPIDER_CASCADE = [13, 12, 11, 10].map((rank) => ({ rank, suit: "spades" }));

/** Arte no hover do card: endireita e cresce um pouco (sem movimento para quem pediu menos animação). */
const HOVER = "transition-[rotate,scale] duration-300 ease-out motion-safe:group-hover:rotate-0 motion-safe:group-hover:scale-110";

/** Cor do feltro na home por tipo de jogo: cartas e peças no verde, tabuleiro no vinho, palavras e lógica no azul. */
const FELT: Record<string, string> = {
  sudoku: "felt-blue",
  verbete: "felt-blue",
  stop: "felt-blue",
  "connect-4": "felt-wine",
  otrio: "felt-wine",
  "jogo-da-velha": "felt-wine",
  xadrez: "felt-wine",
  damas: "felt-wine",
  ludo: "felt-wine",
  "batalha-naval": "felt-wine",
  "futebol-de-botao": "felt-wine",
};

/** Card de cada jogo na home: arte (posicionada sobre o feltro), título e subtítulo */
const CARDS: { slug: string; title: string; sub: string; art: ReactNode }[] = [
  {
    slug: "truco-paulista",
    title: "TRUCO",
    sub: "PAULISTA",
    art: (
      <div className={`absolute inset-x-0 top-[12%] mx-auto h-1/2 w-1/2 ${HOVER}`}>
        {TRUCO_FAN.map((c, i) => (
          <div
            key={c.id}
            className="absolute bottom-0 left-1/2 w-[38%] origin-bottom transition-transform duration-300 ease-out [transform:translateX(-50%)_rotate(var(--r))] motion-safe:group-hover:[transform:translateX(-50%)_rotate(var(--rh))]"
            style={{ "--r": `${(i - 1) * 16}deg`, "--rh": `${(i - 1) * 28}deg` } as CSSProperties}
          >
            <CardImg card={c} />
          </div>
        ))}
      </div>
    ),
  },
  {
    slug: "paciencia-spider",
    title: "PACIÊNCIA",
    sub: "SPIDER",
    art: (
      <div className="absolute left-1/2 top-[8%] h-[58%] w-[19%] -translate-x-1/2 transition-[top] duration-300 ease-out motion-safe:group-hover:top-[4%]">
        {SPIDER_CASCADE.map((c, i) => (
          <div
            key={c.rank}
            className="absolute left-0 w-full transition-[top] duration-300 ease-out [top:calc(var(--i)*13%)] motion-safe:group-hover:[top:calc(var(--i)*15.5%)]"
            style={{ "--i": i } as CSSProperties}
          >
            <CardImg card={c} />
          </div>
        ))}
      </div>
    ),
  },
  {
    slug: "sudoku",
    title: "SUDOKU",
    sub: "9 × 9",
    art: (
      <div className={`absolute left-1/2 top-[8%] w-[36%] -translate-x-1/2 -rotate-6 text-[clamp(7px,2.2vw,12px)] ${HOVER}`}>
        <MiniBoard />
      </div>
    ),
  },
  {
    slug: "verbete",
    title: "VERBETE",
    sub: "PALAVRA DO DIA",
    art: (
      <div className={`absolute left-1/2 top-[9%] -translate-x-1/2 -rotate-3 text-[clamp(10px,3vw,15px)] ${HOVER}`}>
        <MiniTiles />
      </div>
    ),
  },
  {
    slug: "connect-4",
    title: "CONNECT",
    sub: "4 EM LINHA",
    art: (
      <div className={`absolute left-1/2 top-[9%] w-[44%] -translate-x-1/2 rotate-3 ${HOVER}`}>
        <StaticBoard rows={["...y...", "..yr...", ".yrr.r.", "yrryry."]} win={[[0, 0], [1, 1], [2, 2], [3, 3]]} dim={false} />
      </div>
    ),
  },
  {
    slug: "otrio",
    title: "OTRIO",
    sub: "TRINCA DE ANÉIS",
    art: (
      <div className={`absolute left-1/2 top-[7%] w-[40%] -translate-x-1/2 -rotate-3 ${HOVER}`}>
        <OtrioBoard cells={["r..", "..b", "..g", ".p.", "rrr", "", "p..", "b..", ".g."]} win={[12, 13, 14]} dim={false} />
      </div>
    ),
  },
  {
    slug: "jogo-da-velha",
    title: "VELHA",
    sub: "JOGO DA VELHA",
    art: (
      <div className={`absolute left-1/2 top-[9%] w-[34%] -translate-x-1/2 rotate-3 ${HOVER}`}>
        <VelhaBoard cells="XO.OX...X" win={[0, 4, 8]} />
      </div>
    ),
  },
  {
    slug: "xadrez",
    title: "XADREZ",
    sub: "XEQUE-MATE",
    art: (
      <div className={`absolute left-1/2 top-[8%] w-[38%] -translate-x-1/2 rotate-3 ${HOVER}`}>
        <ChessBoard fen="r1bqk1nr/pppp1ppp/2n5/2b1p3/2B1P3/5N2/PPPP1PPP/RNBQK2R" />
      </div>
    ),
  },
  {
    slug: "damas",
    title: "DAMAS",
    sub: "CLÁSSICO",
    art: (
      <div className={`absolute left-1/2 top-[8%] w-[38%] -translate-x-1/2 -rotate-3 ${HOVER}`}>
        <DamasBoard rows={["", "..b.B...", ".b...b..", "....w...", ".....W..", "w.w.....", ".w......"]} />
      </div>
    ),
  },
  {
    slug: "ludo",
    title: "LUDO",
    sub: "CORRIDA DE PEÕES",
    art: (
      <div className={`absolute left-1/2 top-[7%] w-[40%] -translate-x-1/2 rotate-3 ${HOVER}`}>
        <LudoBoard
          pieces={[
            { color: 0, piece: 0, progress: 7 },
            { color: 1, piece: 0, progress: 3 },
            { color: 2, piece: 0, progress: 18 },
            { color: 3, piece: 0, progress: 52 },
            { color: 0, piece: 1, progress: 56 },
          ]}
        />
      </div>
    ),
  },
  {
    slug: "domino",
    title: "DOMINÓ",
    sub: "BATIDA",
    art: (
      <div className={`absolute left-1/2 top-[20%] flex w-[68%] -translate-x-1/2 -rotate-6 items-center justify-center gap-0 transition-[gap] duration-300 motion-safe:group-hover:gap-[2%] drop-shadow-[0_4px_0_rgba(0,0,0,0.3)] ${HOVER}`}>
        <Domino a={2} b={6} flat className="w-[30%]" />
        <Domino a={6} b={6} className="w-[15%]" />
        <Domino a={6} b={3} flat className="w-[30%]" />
        <Domino a={3} b={3} className="w-[15%]" />
      </div>
    ),
  },
  {
    slug: "futebol-de-botao",
    title: "FUTEBOL",
    sub: "DE BOTÃO",
    art: (
      <div className={`absolute left-1/2 top-[14%] w-[62%] -translate-x-1/2 -rotate-3 drop-shadow-[0_4px_0_rgba(0,0,0,0.35)] ${HOVER}`}>
        <FieldArt className="w-full" />
      </div>
    ),
  },
  {
    slug: "stop",
    title: "STOP",
    sub: "ADEDONHA",
    art: (
      <div className={`absolute left-1/2 top-[20%] -translate-x-1/2 -rotate-3 text-[clamp(28px,9vw,44px)] ${HOVER}`}>
        <StopLogo className="h-[1.5em] w-[1.5em]" />
      </div>
    ),
  },
  {
    slug: "batalha-naval",
    title: "BATALHA",
    sub: "NAVAL",
    art: (
      <div className={`absolute left-1/2 top-[9%] w-[40%] -translate-x-1/2 rotate-3 ${HOVER}`}>
        <SeaLogo />
      </div>
    ),
  },
  {
    slug: "codenames",
    title: "CODENAMES",
    sub: "AGENTES SECRETOS",
    art: (
      <div className={`absolute left-1/2 top-[10%] w-[44%] -translate-x-1/2 -rotate-3 ${HOVER}`}>
        <MiniGrid />
      </div>
    ),
  },
];

const tiles: GameTile[] = CARDS.map(({ slug, title, sub, art }) => {
  const g = getGame(slug);
  return {
    slug,
    players: g.players,
    card: (
      <Link
        href={g.path}
        className={`felt ${FELT[slug] ?? ""} group relative flex aspect-[4/3] flex-col items-center justify-end overflow-hidden rounded-3xl pb-5 transition duration-300 hover:-translate-y-1.5`}
      >
        {art}
        <span className="flex flex-col items-center leading-none drop-shadow-[0_2px_0_#000]">
          <span className="font-display text-3xl text-gold transition-[text-shadow] duration-300 group-hover:[text-shadow:0_0_18px_rgba(242,193,78,0.55)]">{title}</span>
          <span className="mt-1 font-display text-xs tracking-[0.35em] text-white/80">{sub}</span>
        </span>
      </Link>
    ),
  };
});

export const metadata: Metadata = { alternates: { canonical: "/", languages: { "pt-BR": "/" } }, openGraph: { url: "/" } };

export default function Home() {
  return (
    <div className="table-texture relative isolate min-h-dvh bg-[#0f1813]">
      <TableDecor />
      <header className="relative z-10 mx-auto flex max-w-6xl justify-end px-4 pt-4">
        <UserButton />
      </header>
      <main className="relative mx-auto flex max-w-6xl flex-col items-center gap-10 px-4 pb-12 pt-2">
        <JsonLd data={homeLd()} />
        <h1 className="text-center font-display text-4xl tracking-wide text-gold drop-shadow-[0_3px_0_#7a4e0c] sm:text-5xl">MESA DE JOGOS</h1>
        <p className="-mt-6 max-w-md text-center text-sm text-white/60">{SITE_TAGLINE}</p>

        <GameGrid games={tiles} />
      </main>
      <SiteFooter />
    </div>
  );
}
