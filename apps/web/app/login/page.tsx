import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { makeCard } from "@truco/game";
import { BackButton } from "@/components/BackButton";
import { LoginOptions } from "@/components/auth/LoginOptions";
import { errorMessage } from "@/components/auth/providers";
import { CardImg } from "@/components/cards/Card";
import { MiniGrid } from "@/components/codenames/Board";
import { StaticBoard } from "@/components/connect4/Board";
import { StopLogo } from "@/components/stop/Tile";
import { MiniBoard } from "@/components/sudoku/common";
import { auth } from "@/lib/auth";
import { safeNext } from "@/lib/login";

export const metadata: Metadata = { title: "Entrar", robots: { index: false, follow: false } };

const FAN = [makeCard("4", "clubs"), makeCard("7", "hearts"), makeCard("A", "spades")];

/** Artes dos jogos espalhadas pela mesa, como peças esquecidas depois de uma partida. */
function TableArt() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0">
      <div className="absolute left-[4%] top-[3%] h-[24%] w-[30%] -rotate-12">
        {FAN.map((c, i) => (
          <div
            key={c.id}
            className="absolute bottom-0 left-1/2 w-[46%] origin-bottom"
            style={{ transform: `translateX(-50%) rotate(${(i - 1) * 16}deg)` }}
          >
            <CardImg card={c} />
          </div>
        ))}
      </div>
      <div className="absolute right-[6%] top-[5%] w-[26%] rotate-[10deg] text-[clamp(5px,1.6vw,8px)]">
        <MiniBoard />
      </div>
      <div className="absolute bottom-[5%] left-[5%] w-[34%] rotate-6">
        <StaticBoard rows={["...y...", "..yr...", ".yrr.r.", "yrryry."]} win={[[0, 0], [1, 1], [2, 2], [3, 3]]} dim={false} />
      </div>
      <div className="absolute bottom-[6%] right-[5%] w-[30%] -rotate-6">
        <MiniGrid />
      </div>
      <div className="absolute left-1/2 top-[22%] -translate-x-1/2 rotate-[-4deg] text-[clamp(10px,2.6vw,14px)]">
        <StopLogo className="h-[1.5em] w-[1.5em]" />
      </div>
    </div>
  );
}

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const { next: rawNext, error } = await searchParams;
  const next = safeNext(rawNext);

  const session = await auth.api.getSession({ headers: await headers() });
  if (session) redirect(next);

  return (
    <main className="flex min-h-dvh items-center justify-center bg-[#0f1813] px-6 py-20">
      <BackButton href={next} className="fixed left-4 top-4" />

      <div className="felt relative aspect-[4/5] w-full max-w-md overflow-hidden rounded-3xl">
        <TableArt />

        {/* luz no centro da mesa, para o título e o botão respirarem */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_55%_38%_at_center,rgba(10,30,20,0.85),transparent)]" />

        <div className="relative flex h-full flex-col items-center justify-center gap-6 px-8">
          <h1 className="text-center font-display text-4xl leading-none tracking-wide text-gold drop-shadow-[0_3px_0_#7a4e0c] sm:text-5xl">
            MESA
            <br />
            DE JOGOS
          </h1>

          <div className="flex w-full max-w-64 flex-col gap-3">
            {error && (
              <p role="alert" className="rounded-xl bg-red-950/80 px-3 py-2 text-center text-xs text-red-200 ring-1 ring-red-500/40">
                {errorMessage(error)}
              </p>
            )}
            <LoginOptions next={next} />
          </div>
        </div>
      </div>
    </main>
  );
}
