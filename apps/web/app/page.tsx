import type { Metadata } from "next";
import type { CSSProperties, ReactNode } from "react";
import Link from "next/link";
import { JsonLd } from "@/components/seo";
import { getGame, homeLd } from "@/lib/seo";
import { makeCard } from "@mesa/truco";
import { CardImg } from "@/components/cards/Card";
import { MiniBoard } from "@/components/sudoku/common";
import { MiniTiles } from "@/components/verbete/Tile";
import { WordArt } from "@/components/caca-palavras/common";
import { StopLogo } from "@/components/stop/Tile";
import { SeaLogo } from "@/components/batalha-naval/Sea";
import { MiniGrid } from "@/components/codenames/Board";
import { FieldArt } from "@/components/futebol-de-botao/Field";
import { TijoladaArt } from "@/components/tijolada/Art";
import { Domino } from "@/components/domino/Tile";
import { Chip } from "@/components/blackjack/Chips";
import { UserButton } from "@/components/UserButton";
import { ChipBalance } from "@/components/chips/ChipBalance";
import { ShopButton } from "@/components/shop/ShopButton";
import { GameGrid, PlayersBadge, type GameTile } from "@/components/home/GameGrid";
import { SiteFooter } from "@/components/SiteFooter";
import { TableDecor } from "@/components/home/TableDecor";
import { WoodRail, WoodSign } from "@/components/home/WoodTop";
import { DailyRibbon } from "@/components/home/DailyRibbon";
import { HoverCard } from "@/components/home/HoverCard";
import { ChessArt, Connect4Art, DamasArt, LudoArt, OtrioArt, VelhaArt } from "@/components/home/BoardArts";
import { isDailyGame } from "@/lib/daily/challenge";
import { SPIDER_DAILY_PATH } from "@/lib/spider/paths";
import { SUDOKU_DAILY_PATH } from "@/lib/sudoku/paths";
import { VERBETE_DAILY_PATH } from "@/lib/verbete/paths";
import { CACA_DAILY_PATH } from "@/lib/caca-palavras/paths";

const TRUCO_FAN = [makeCard("4", "clubs"), makeCard("7", "hearts"), makeCard("A", "spades")];
/** Buraco: sequência de copas com o coringa no lugar do 8. */
const BURACO_RUN = [
  { rank: "6", suit: "hearts" },
  { rank: "7", suit: "hearts" },
  { rank: "JK", suit: "", file: "black_joker" },
  { rank: "9", suit: "hearts" },
];
/** Blackjack: ás e valete (21 de cara) com uma ficha. */
const BLACKJACK_HAND = [
  { rank: "A", suit: "spades" },
  { rank: "J", suit: "hearts" },
];
const SPIDER_CASCADE = [13, 12, 11, 10].map((rank) => ({ rank, suit: "spades" }));

/** Arte no hover do card: endireita e cresce um pouco (sem movimento para quem pediu menos animação). */
const HOVER = "transition-[rotate,scale] duration-300 ease-out motion-safe:group-hover:rotate-0 motion-safe:group-hover:scale-110";

/** Cor do feltro na home por tipo de jogo: cartas e peças no verde, tabuleiro no vinho, palavras e lógica no azul. */
const FELT: Record<string, string> = {
  sudoku: "felt-blue",
  verbete: "felt-blue",
  "caca-palavras": "felt-blue",
  stop: "felt-blue",
  "connect-4": "felt-wine",
  otrio: "felt-wine",
  "jogo-da-velha": "felt-wine",
  xadrez: "felt-wine",
  damas: "felt-wine",
  ludo: "felt-wine",
  "batalha-naval": "felt-wine",
  "futebol-de-botao": "felt-wine",
  tijolada: "felt-blue",
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
    slug: "buraco",
    title: "BURACO",
    sub: "CANASTRAS",
    art: (
      <div className={`absolute left-1/2 top-[19%] flex w-[58%] -translate-x-1/2 -rotate-3 items-end drop-shadow-[0_4px_0_rgba(0,0,0,0.3)] ${HOVER}`}>
        {BURACO_RUN.map((c, i) => (
          <div key={i} className={`${i === 2 ? "hc-wild" : "hc-meld"} w-[34%] shrink-0 ${i ? "-ml-[16%]" : ""} [--d:${i}]`}>
            <CardImg card={c} />
          </div>
        ))}
      </div>
    ),
  },
  {
    slug: "blackjack",
    title: "BLACKJACK",
    sub: "VINTE E UM",
    art: (
      <div className={`absolute left-1/2 top-[14%] flex w-[46%] -translate-x-1/2 rotate-3 items-end ${HOVER}`}>
        {BLACKJACK_HAND.map((c, i) => (
          <div key={i} className={`w-[56%] shrink-0 ${i ? "-ml-[22%] rotate-[9deg]" : "-rotate-[7deg]"}`}>
            <div className="hc-bj-deal drop-shadow-[0_4px_0_rgba(0,0,0,0.3)]" style={{ "--d": i } as CSSProperties}>
              <CardImg card={c} />
            </div>
          </div>
        ))}
        <div className="absolute -bottom-[6%] -right-[10%] w-[30%]">
          <div className="hc-bj-chip">
            <Chip value={100} className="w-full drop-shadow-[0_3px_2px_rgba(0,0,0,0.5)]" />
          </div>
        </div>
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
        <MiniBoard solve />
      </div>
    ),
  },
  {
    slug: "verbete",
    title: "VERBETE",
    sub: "PALAVRA DO DIA",
    art: (
      <div className={`absolute left-1/2 top-[9%] -translate-x-1/2 -rotate-3 text-[clamp(10px,3vw,15px)] ${HOVER}`}>
        <MiniTiles flip />
      </div>
    ),
  },
  {
    slug: "caca-palavras",
    title: "CAÇA",
    sub: "PALAVRAS",
    art: (
      <div className={`absolute left-1/2 top-[8%] w-[36%] -translate-x-1/2 rotate-3 text-[clamp(9px,2.6vw,14px)] ${HOVER}`}>
        <WordArt sweep />
      </div>
    ),
  },
  {
    slug: "connect-4",
    title: "CONNECT",
    sub: "4 EM LINHA",
    art: (
      <div className={`absolute left-1/2 top-[9%] w-[44%] -translate-x-1/2 rotate-3 ${HOVER}`}>
        <Connect4Art />
      </div>
    ),
  },
  {
    slug: "otrio",
    title: "OTRIO",
    sub: "TRINCA DE ANÉIS",
    art: (
      <div className={`absolute left-1/2 top-[7%] w-[40%] -translate-x-1/2 -rotate-3 ${HOVER}`}>
        <OtrioArt />
      </div>
    ),
  },
  {
    slug: "jogo-da-velha",
    title: "VELHA",
    sub: "JOGO DA VELHA",
    art: (
      <div className={`absolute left-1/2 top-[9%] w-[34%] -translate-x-1/2 rotate-3 ${HOVER}`}>
        <VelhaArt />
      </div>
    ),
  },
  {
    slug: "xadrez",
    title: "XADREZ",
    sub: "XEQUE-MATE",
    art: (
      <div className={`absolute left-1/2 top-[8%] w-[38%] -translate-x-1/2 rotate-3 ${HOVER}`}>
        <ChessArt />
      </div>
    ),
  },
  {
    slug: "damas",
    title: "DAMAS",
    sub: "CLÁSSICO",
    art: (
      <div className={`absolute left-1/2 top-[8%] w-[38%] -translate-x-1/2 -rotate-3 ${HOVER}`}>
        <DamasArt />
      </div>
    ),
  },
  {
    slug: "ludo",
    title: "LUDO",
    sub: "CORRIDA DE PEÕES",
    art: (
      <div className={`absolute left-1/2 top-[7%] w-[40%] -translate-x-1/2 rotate-3 ${HOVER}`}>
        <LudoArt />
      </div>
    ),
  },
  {
    slug: "domino",
    title: "DOMINÓ",
    sub: "BATIDA",
    art: (
      <div className={`absolute left-1/2 top-[20%] flex w-[68%] -translate-x-1/2 -rotate-6 items-center justify-center gap-0 transition-[gap] duration-300 motion-safe:group-hover:gap-[2%] drop-shadow-[0_4px_0_rgba(0,0,0,0.3)] ${HOVER}`}>
        <Domino a={2} b={6} flat className="hc-drop w-[30%] [--d:0]" />
        <Domino a={6} b={6} className="hc-drop w-[15%] [--d:1]" />
        <Domino a={6} b={3} flat className="hc-drop w-[30%] [--d:2]" />
        <Domino a={3} b={3} className="hc-drop w-[15%] [--d:3]" />
      </div>
    ),
  },
  {
    slug: "futebol-de-botao",
    title: "FUTEBOL",
    sub: "DE BOTÃO",
    art: (
      <div className={`absolute left-1/2 top-[14%] w-[62%] -translate-x-1/2 -rotate-3 drop-shadow-[0_4px_0_rgba(0,0,0,0.35)] ${HOVER}`}>
        <FieldArt className="w-full" shot />
      </div>
    ),
  },
  {
    slug: "tijolada",
    title: "TIJOLADA",
    sub: "SOLO E 1×1",
    art: (
      <div className={`absolute left-1/2 top-[10%] w-[30%] -translate-x-1/2 rotate-3 drop-shadow-[0_4px_0_rgba(0,0,0,0.35)] ${HOVER}`}>
        <TijoladaArt className="w-full" play />
      </div>
    ),
  },
  {
    slug: "stop",
    title: "STOP",
    sub: "ADEDONHA",
    art: (
      <div className={`absolute left-1/2 top-[20%] -translate-x-1/2 -rotate-3 text-[clamp(28px,9vw,44px)] ${HOVER}`}>
        <StopLogo className="h-[1.5em] w-[1.5em]" hop />
      </div>
    ),
  },
  {
    slug: "batalha-naval",
    title: "BATALHA",
    sub: "NAVAL",
    art: (
      <div className={`absolute left-1/2 top-[9%] w-[40%] -translate-x-1/2 rotate-3 ${HOVER}`}>
        <SeaLogo salvo={[[4, 3], [4, 4], [4, 5]]} />
      </div>
    ),
  },
  {
    slug: "codenames",
    title: "CODENAMES",
    sub: "AGENTES SECRETOS",
    art: (
      <div className={`absolute left-1/2 top-[10%] w-[44%] -translate-x-1/2 -rotate-3 ${HOVER}`}>
        <MiniGrid reveal={{ 1: 1, 3: 0, 5: "neutral" }} />
      </div>
    ),
  },
];

/** Jogos com desafio do dia: a fita do card leva direto a ele. */
const DAILY_PATH = { sudoku: SUDOKU_DAILY_PATH, "paciencia-spider": SPIDER_DAILY_PATH, verbete: VERBETE_DAILY_PATH, "caca-palavras": CACA_DAILY_PATH };

const tiles: GameTile[] = CARDS.map(({ slug, title, sub, art }) => {
  const g = getGame(slug);
  return {
    slug,
    players: g.players,
    card: (
      // a fita do desafio é outro link, por isso fica ao lado do card (e o hover vale para os dois)
      <HoverCard className="group relative transition duration-300 hover:-translate-y-1.5">
        <Link href={g.path} className={`felt ${FELT[slug] ?? ""} relative flex aspect-[4/3] flex-col items-center justify-end overflow-hidden rounded-3xl pb-5`}>
          {art}
          <PlayersBadge players={g.players} />
          <span className="flex flex-col items-center leading-none drop-shadow-[0_2px_0_#000]">
            <span className="font-display text-3xl text-gold transition-[text-shadow] duration-300 group-hover:[text-shadow:0_0_18px_rgba(242,193,78,0.55)]">{title}</span>
            <span className="mt-1 font-display text-xs tracking-[0.35em] text-white/80">{sub}</span>
          </span>
        </Link>
        {isDailyGame(slug) && <DailyRibbon href={DAILY_PATH[slug]} />}
      </HoverCard>
    ),
  };
});

export const metadata: Metadata = { alternates: { canonical: "/", languages: { "pt-BR": "/" } }, openGraph: { url: "/" } };

export default function Home() {
  return (
    <div className="table-texture relative isolate min-h-dvh bg-[#0f1813]">
      <TableDecor />
      <WoodRail>
        <ShopButton />
        <ChipBalance />
        <UserButton />
      </WoodRail>
      <main className="relative mx-auto flex max-w-6xl flex-col items-center gap-10 px-4 pb-12">
        <JsonLd data={homeLd()} />
        <WoodSign>
          <h1 className="text-center font-display text-3xl tracking-wide text-gold drop-shadow-[0_3px_0_#2a1608] sm:text-5xl">MESA DE JOGOS</h1>
        </WoodSign>

        <GameGrid games={tiles} />
      </main>
      <SiteFooter />
    </div>
  );
}
