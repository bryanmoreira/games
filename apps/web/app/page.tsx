import Link from "next/link";
import { makeCard } from "@truco/game";
import { CardImg } from "@/components/cards/Card";
import { TRUCO_PATH } from "@/lib/truco/paths";
import { SPIDER_PATH } from "@/lib/spider/paths";

const TRUCO_FAN = [makeCard("4", "clubs"), makeCard("7", "hearts"), makeCard("A", "spades")];
const SPIDER_CASCADE = [13, 12, 11, 10].map((rank) => ({ rank, suit: "spades" }));

export default function Home() {
  return (
    <main className="mx-auto flex min-h-full max-w-3xl flex-col items-center gap-10 px-4 py-12">
      <h1 className="font-display text-5xl tracking-wide text-gold drop-shadow-[0_3px_0_#7a4e0c]">JOGOS</h1>

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

        <div className="flex aspect-[4/3] items-center justify-center rounded-3xl border-2 border-dashed border-white/15 font-display text-white/30">
          Em breve
        </div>
      </div>
    </main>
  );
}
