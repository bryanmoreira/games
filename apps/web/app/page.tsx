import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { JsonLd } from "@/components/seo";
import { SITE_TAGLINE, getGame, homeLd } from "@/lib/seo";
import { makeCard } from "@truco/game";
import { CardImg } from "@/components/cards/Card";
import { MiniBoard } from "@/components/sudoku/common";
import { StaticBoard } from "@/components/connect4/Board";
import { StopLogo } from "@/components/stop/Tile";
import { SeaLogo } from "@/components/batalha-naval/Sea";
import { MiniGrid } from "@/components/codenames/Board";
import { StaticBoard as OtrioBoard } from "@/components/otrio/Board";
import { UserButton } from "@/components/UserButton";
import { GameGrid, type GameTile } from "@/components/home/GameGrid";
import { SiteFooter } from "@/components/SiteFooter";

const TRUCO_FAN = [makeCard("4", "clubs"), makeCard("7", "hearts"), makeCard("A", "spades")];
const SPIDER_CASCADE = [13, 12, 11, 10].map((rank) => ({ rank, suit: "spades" }));

/** Card de cada jogo na home: arte (posicionada sobre o feltro), título e subtítulo */
const CARDS: { slug: string; title: string; sub: string; art: ReactNode }[] = [
  {
    slug: "truco-paulista",
    title: "TRUCO",
    sub: "PAULISTA",
    art: (
      <div className="absolute inset-x-0 top-[12%] mx-auto h-1/2 w-1/2">
        {TRUCO_FAN.map((c, i) => (
          <div
            key={c.id}
            className="absolute bottom-0 left-1/2 w-[38%] origin-bottom transition-transform duration-300"
            style={{ transform: `translateX(-50%) rotate(${(i - 1) * 16}deg)` }}
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
      <div className="absolute left-1/2 top-[8%] h-[58%] w-[19%] -translate-x-1/2">
        {SPIDER_CASCADE.map((c, i) => (
          <div key={c.rank} className="absolute left-0 w-full" style={{ top: `${i * 13}%` }}>
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
      <div className="absolute left-1/2 top-[8%] w-[36%] -translate-x-1/2 -rotate-6 text-[clamp(7px,2.2vw,12px)]">
        <MiniBoard />
      </div>
    ),
  },
  {
    slug: "connect-4",
    title: "CONNECT",
    sub: "4 EM LINHA",
    art: (
      <div className="absolute left-1/2 top-[9%] w-[44%] -translate-x-1/2 rotate-3">
        <StaticBoard rows={["...y...", "..yr...", ".yrr.r.", "yrryry."]} win={[[0, 0], [1, 1], [2, 2], [3, 3]]} dim={false} />
      </div>
    ),
  },
  {
    slug: "otrio",
    title: "OTRIO",
    sub: "TRINCA DE ANÉIS",
    art: (
      <div className="absolute left-1/2 top-[7%] w-[40%] -translate-x-1/2 -rotate-3">
        <OtrioBoard cells={["r..", "..b", "..g", ".p.", "rrr", "", "p..", "b..", ".g."]} win={[12, 13, 14]} dim={false} />
      </div>
    ),
  },
  {
    slug: "stop",
    title: "STOP",
    sub: "ADEDONHA",
    art: (
      <div className="absolute left-1/2 top-[20%] -translate-x-1/2 -rotate-3 text-[clamp(28px,9vw,44px)]">
        <StopLogo className="h-[1.5em] w-[1.5em]" />
      </div>
    ),
  },
  {
    slug: "batalha-naval",
    title: "BATALHA",
    sub: "NAVAL",
    art: (
      <div className="absolute left-1/2 top-[9%] w-[40%] -translate-x-1/2 rotate-3">
        <SeaLogo />
      </div>
    ),
  },
  {
    slug: "codenames",
    title: "CODENAMES",
    sub: "AGENTES SECRETOS",
    art: (
      <div className="absolute left-1/2 top-[10%] w-[44%] -translate-x-1/2 -rotate-3">
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
        className="felt group relative flex aspect-[4/3] flex-col items-center justify-end overflow-hidden rounded-3xl pb-5 transition hover:-translate-y-1"
      >
        {art}
        <span className="flex flex-col items-center leading-none drop-shadow-[0_2px_0_#000]">
          <span className="font-display text-3xl text-gold">{title}</span>
          <span className="mt-1 font-display text-xs tracking-[0.35em] text-white/80">{sub}</span>
        </span>
      </Link>
    ),
  };
});

export const metadata: Metadata = { alternates: { canonical: "/", languages: { "pt-BR": "/" } }, openGraph: { url: "/" } };

export default function Home() {
  return (
    <div className="min-h-dvh bg-[#0f1813]">
      <header className="mx-auto flex max-w-6xl justify-end px-4 pt-4">
        <UserButton />
      </header>
      <main className="mx-auto flex max-w-6xl flex-col items-center gap-10 px-4 pb-12 pt-2">
        <JsonLd data={homeLd()} />
        <h1 className="text-center font-display text-4xl tracking-wide text-gold drop-shadow-[0_3px_0_#7a4e0c] sm:text-5xl">MESA DE JOGOS</h1>
        <p className="-mt-6 max-w-md text-center text-sm text-white/60">{SITE_TAGLINE}</p>

        <GameGrid games={tiles} />
      </main>
      <SiteFooter />
    </div>
  );
}
