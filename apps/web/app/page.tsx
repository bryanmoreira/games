import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/seo";
import { GAMES, SITE_TAGLINE, homeLd } from "@/lib/seo";
import { makeCard } from "@truco/game";
import { CardImg } from "@/components/cards/Card";
import { TRUCO_PATH } from "@/lib/truco/paths";
import { SPIDER_PATH } from "@/lib/spider/paths";
import { SUDOKU_PATH } from "@/lib/sudoku/paths";
import { MiniBoard } from "@/components/sudoku/common";
import { CONNECT4_PATH } from "@/lib/connect4/paths";
import { StaticBoard } from "@/components/connect4/Board";
import { STOP_PATH } from "@/lib/stop/paths";
import { StopLogo } from "@/components/stop/Tile";
import { BATALHA_PATH } from "@/lib/batalha-naval/paths";
import { SeaLogo } from "@/components/batalha-naval/Sea";
import { CODENAMES_PATH } from "@/lib/codenames/paths";
import { MiniGrid } from "@/components/codenames/Board";

const TRUCO_FAN = [makeCard("4", "clubs"), makeCard("7", "hearts"), makeCard("A", "spades")];
const SPIDER_CASCADE = [13, 12, 11, 10].map((rank) => ({ rank, suit: "spades" }));

export const metadata: Metadata = { alternates: { canonical: "/", languages: { "pt-BR": "/" } }, openGraph: { url: "/" } };

export default function Home() {
  return (
    <div className="min-h-dvh bg-[#0f1813]">
      <main className="mx-auto flex max-w-3xl flex-col items-center gap-10 px-4 py-12">
        <JsonLd data={homeLd()} />
        <h1 className="text-center font-display text-4xl tracking-wide text-gold drop-shadow-[0_3px_0_#7a4e0c] sm:text-5xl">MESA DE JOGOS</h1>
        <p className="-mt-6 max-w-md text-center text-sm text-white/60">{SITE_TAGLINE}</p>

        <div className="grid w-full grid-cols-1 gap-x-12 gap-y-10 sm:grid-cols-2">
          <Link
            href={TRUCO_PATH}
            className="felt group relative flex aspect-[4/3] flex-col items-center justify-end overflow-hidden rounded-3xl pb-5 transition hover:-translate-y-1"
          >
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
            <span className="flex flex-col items-center leading-none drop-shadow-[0_2px_0_#000]">
              <span className="font-display text-3xl text-gold">TRUCO</span>
              <span className="mt-1 font-display text-xs tracking-[0.35em] text-white/80">PAULISTA</span>
            </span>
          </Link>

          <Link
            href={SPIDER_PATH}
            className="felt group relative flex aspect-[4/3] flex-col items-center justify-end overflow-hidden rounded-3xl pb-5 transition hover:-translate-y-1"
          >
            <div className="absolute left-1/2 top-[8%] h-[58%] w-[19%] -translate-x-1/2">
              {SPIDER_CASCADE.map((c, i) => (
                <div key={c.rank} className="absolute left-0 w-full" style={{ top: `${i * 13}%` }}>
                  <CardImg card={c} />
                </div>
              ))}
            </div>
            <span className="flex flex-col items-center leading-none drop-shadow-[0_2px_0_#000]">
              <span className="font-display text-3xl text-gold">PACIÊNCIA</span>
              <span className="mt-1 font-display text-xs tracking-[0.35em] text-white/80">SPIDER</span>
            </span>
          </Link>

          <Link
            href={SUDOKU_PATH}
            className="felt group relative flex aspect-[4/3] flex-col items-center justify-end overflow-hidden rounded-3xl pb-5 transition hover:-translate-y-1"
          >
            <div className="absolute left-1/2 top-[8%] w-[36%] -translate-x-1/2 -rotate-6 text-[clamp(7px,2.2vw,12px)]">
              <MiniBoard />
            </div>
            <span className="flex flex-col items-center leading-none drop-shadow-[0_2px_0_#000]">
              <span className="font-display text-3xl text-gold">SUDOKU</span>
              <span className="mt-1 font-display text-xs tracking-[0.35em] text-white/80">9 × 9</span>
            </span>
          </Link>

          <Link
            href={CONNECT4_PATH}
            className="felt group relative flex aspect-[4/3] flex-col items-center justify-end overflow-hidden rounded-3xl pb-5 transition hover:-translate-y-1"
          >
            <div className="absolute left-1/2 top-[9%] w-[44%] -translate-x-1/2 rotate-3">
              <StaticBoard rows={["...y...", "..yr...", ".yrr.r.", "yrryry."]} win={[[0, 0], [1, 1], [2, 2], [3, 3]]} dim={false} />
            </div>
            <span className="flex flex-col items-center leading-none drop-shadow-[0_2px_0_#000]">
              <span className="font-display text-3xl text-gold">CONNECT</span>
              <span className="mt-1 font-display text-xs tracking-[0.35em] text-white/80">4 EM LINHA</span>
            </span>
          </Link>

          <Link
            href={STOP_PATH}
            className="felt group relative flex aspect-[4/3] flex-col items-center justify-end overflow-hidden rounded-3xl pb-5 transition hover:-translate-y-1"
          >
            <div className="absolute left-1/2 top-[20%] -translate-x-1/2 -rotate-3 text-[clamp(28px,9vw,44px)]">
              <StopLogo className="h-[1.5em] w-[1.5em]" />
            </div>
            <span className="flex flex-col items-center leading-none drop-shadow-[0_2px_0_#000]">
              <span className="font-display text-3xl text-gold">STOP</span>
              <span className="mt-1 font-display text-xs tracking-[0.35em] text-white/80">ADEDONHA</span>
            </span>
          </Link>

          <Link
            href={BATALHA_PATH}
            className="felt group relative flex aspect-[4/3] flex-col items-center justify-end overflow-hidden rounded-3xl pb-5 transition hover:-translate-y-1"
          >
            <div className="absolute left-1/2 top-[9%] w-[40%] -translate-x-1/2 rotate-3">
              <SeaLogo />
            </div>
            <span className="flex flex-col items-center leading-none drop-shadow-[0_2px_0_#000]">
              <span className="font-display text-3xl text-gold">BATALHA</span>
              <span className="mt-1 font-display text-xs tracking-[0.35em] text-white/80">NAVAL</span>
            </span>
          </Link>

          <Link
            href={CODENAMES_PATH}
            className="felt group relative flex aspect-[4/3] flex-col items-center justify-end overflow-hidden rounded-3xl pb-5 transition hover:-translate-y-1"
          >
            <div className="absolute left-1/2 top-[10%] w-[44%] -translate-x-1/2 -rotate-3">
              <MiniGrid />
            </div>
            <span className="flex flex-col items-center leading-none drop-shadow-[0_2px_0_#000]">
              <span className="font-display text-3xl text-gold">CODENAMES</span>
              <span className="mt-1 font-display text-xs tracking-[0.35em] text-white/80">AGENTES SECRETOS</span>
            </span>
          </Link>

          <div className="flex aspect-[4/3] items-center justify-center rounded-3xl border-2 border-dashed border-white/15 font-display text-white/30">
            Em breve
          </div>
        </div>

        <nav aria-label="Como jogar" className="flex flex-col items-center gap-3 text-center">
          <h2 className="font-display text-lg text-gold">Como jogar</h2>
          <ul className="flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm text-white/60">
            {GAMES.map((g) => (
              <li key={g.slug}>
                <Link href={`${g.path}/como-jogar`} className="underline-offset-4 hover:text-gold hover:underline">
                  {g.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </main>
    </div>
  );
}
