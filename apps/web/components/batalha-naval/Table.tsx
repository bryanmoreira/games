"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { shipCells, SIZE, type Cell, type PlayerView, type Seat, type Ship } from "@truco/batalha-naval";
import type { RoomInfo } from "@truco/game";
import { send } from "@/lib/socket";
import { BATALHA_PATH } from "@/lib/batalha-naval/paths";
import { HowToPlayModal } from "@/components/ui/HowToPlayModal";
import { HelpButton, MuteButton } from "@/components/ui/buttons";
import { ExitConfirm } from "@/components/ui/ExitConfirm";
import { EndStat, GameEnd } from "@/components/ui/GameEnd";
import { playLoseSound, playWinSound, useAudioUnlock } from "@/lib/sound";
import { playBoomSound, playSplashSound, playSunkSound, playWhistleSound } from "@/lib/batalha-naval/sound";
import { cellStyle, Crosshair, Fire, FleetRow, Sea, SeaShip, ShipShape, ShotFx, Splash } from "./Sea";
import { Placement } from "./Placement";
import { HowToPlay } from "./HowToPlay";
import { SeatFace } from "@/components/ui/SeatFace";

// Mira descendo até o impacto (ver .bn-aim / .bn-pop)
const IMPACT_MS = 350;

const key = (c: Cell) => c.row * SIZE + c.col;

/** Casas dos navios afundados. */
function sunkCells(ships: { ship: Ship; index: number }[]) {
  return new Set(ships.flatMap(({ ship, index }) => shipCells(ship, index).map(key)));
}

export function Table({ room, view }: { room: RoomInfo; view: PlayerView }) {
  const router = useRouter();
  const me = view.seat;
  const opp = (1 - me) as Seat;
  const over = view.phase === "gameOver";
  const placing = view.phase === "placing";

  const [help, setHelp] = useState(false);
  const [hover, setHover] = useState<Cell | null>(null);
  const enemySea = useRef<HTMLDivElement>(null);

  // só animam os tiros dados depois de abrir a mesa (recarregar não repete)
  const seen = useRef({ game: view.gameNo, shots: view.shots.length });
  if (seen.current.game !== view.gameNo) seen.current = { game: view.gameNo, shots: 0 };
  const animateFrom = seen.current.shots;

  useSounds(view);
  const showEnd = useEndDelay(view);

  const leave = () => {
    send({ t: "leave" });
    router.push(BATALHA_PATH);
  };

  const myShots = view.shots.filter((s) => s.seat === me);
  const theirShots = view.shots.filter((s) => s.seat === opp);
  const shotAt = new Set(myShots.map(key));
  const lastIndex = view.shots.length - 1;

  const cellFrom = (e: { clientX: number; clientY: number }): Cell | null => {
    const r = enemySea.current?.getBoundingClientRect();
    if (!r) return null;
    const col = Math.floor(((e.clientX - r.left) / r.width) * SIZE);
    const row = Math.floor(((e.clientY - r.top) / r.height) * SIZE);
    return col >= 0 && col < SIZE && row >= 0 && row < SIZE ? { col, row } : null;
  };

  const shoot = (e: React.MouseEvent) => {
    const c = cellFrom(e);
    if (!c || !view.canShoot || shotAt.has(key(c))) return;
    send({ t: "action", action: { type: "shoot", col: c.col, row: c.row } });
  };

  // navios afundados de cada lado
  const enemySunk = view.enemyShips.filter((k) => k.sunk);
  const enemySunkCells = sunkCells(enemySunk);
  const mySunkIdx = new Set(theirShots.filter((s) => s.sunk !== null).map((s) => s.sunk!));
  const mySunkCells = sunkCells((view.myFleet ?? []).flatMap((ship, index) => (mySunkIdx.has(index) ? [{ ship, index }] : [])));
  // tiro que afundou cada navio (para animar a troca de cor)
  const sunkAt = (seat: Seat, index: number) => view.shots.findIndex((s) => s.seat === seat && s.sunk === index);

  const aim = hover && view.canShoot && !shotAt.has(key(hover)) ? hover : null;

  const stats = (seat: Seat) => {
    const shots = view.shots.filter((s) => s.seat === seat);
    const hits = shots.filter((s) => s.hit).length;
    return { shots: shots.length, pct: shots.length ? Math.round((hits * 100) / shots.length) : 0 };
  };

  return (
    <main className="flex h-dvh flex-col overflow-hidden">
      <header className="relative z-40 flex items-center justify-between gap-1.5 px-2 py-2 sm:gap-2 sm:px-6">
        <div className="flex items-center gap-1.5 rounded-2xl bg-black/40 px-3 py-2 font-display sm:gap-3 sm:px-4">
          <Score tone="gold" value={view.scores[me]} />
          {/* espaçador do rótulo + altura da linha dos números, para o × alinhar com os placares */}
          <div className="flex flex-col items-center leading-none" aria-hidden="true">
            <span className="invisible h-3">×</span>
            <span className="flex h-[1em] items-center text-3xl">
              <span className="text-base text-white/30">×</span>
            </span>
          </div>
          <Score tone="red" value={view.scores[opp]} />
        </div>

        <div className="flex items-center gap-1 sm:gap-2">
          {!room.solo && <span className="hidden font-display text-white/40 sm:inline">{room.code}</span>}
          <HelpButton onClick={() => setHelp(true)} />
          <MuteButton />
          <ExitConfirm onExit={leave} ask={!over} />
        </div>
      </header>

      <section className="relative mx-auto mb-3 mt-8 w-[calc(100%-1.5rem)] max-w-[1100px] flex-1 sm:mt-10 sm:w-[calc(100%-7rem)] lg:mt-11">
        <div className="felt absolute inset-0 rounded-[48px] sm:rounded-[120px]" />

        <Opponent
          room={room}
          seat={opp}
          ready={placing && view.ready[opp]}
          turn={(view.phase === "battle" && view.turn === opp) || (placing && !view.ready[opp] && view.ready[me])}
        />

        <div className="bn-field absolute inset-0">
          {placing ? (
            <Placement key={view.gameNo} view={view} code={room.code} />
          ) : (
            <div className="bn-layout">
              {/* mar do adversário: onde você atira */}
              <div className="bn-big flex flex-col items-center gap-2">
                {/* margem do tamanho da moldura do mar, para o brilho da vez ficar por fora dela */}
                <div className={`w-full rounded-xl p-[6px] ${view.canShoot ? "turn-glow" : ""}`}>
                  <Sea ref={enemySea} className={view.canShoot ? "cursor-crosshair" : ""}>
                    {view.enemyShips.map((k) => (
                      <SeaShip
                        key={k.index}
                        ship={k.ship}
                        index={k.index}
                        tone={k.sunk ? "sunk" : "ghost"}
                        className={k.sunk && sunkAt(me, k.index) >= animateFrom ? "bn-sink" : ""}
                      />
                    ))}
                    {myShots.map((s) => {
                      const i = view.shots.indexOf(s);
                      const fresh = i >= animateFrom && i === lastIndex;
                      return (
                        <span key={key(s)} className="pointer-events-none absolute" style={cellStyle(s.col, s.row)}>
                          {s.hit ? <Fire out={enemySunkCells.has(key(s))} className={fresh ? "bn-pop" : ""} /> : <Splash className={fresh ? "bn-pop" : ""} />}
                          {fresh && <ShotFx hit={s.hit} />}
                        </span>
                      );
                    })}
                    {aim && (
                      <span className="pointer-events-none absolute p-[6%] [@media(hover:none)]:hidden" style={cellStyle(aim.col, aim.row)}>
                        <Crosshair />
                      </span>
                    )}
                    {!over && (
                      <div
                        className="absolute inset-0"
                        onPointerMove={(e) => e.pointerType === "mouse" && setHover(cellFrom(e))}
                        onPointerLeave={() => setHover(null)}
                        onClick={shoot}
                      />
                    )}
                  </Sea>
                </div>
                <FleetRow sunk={new Set(enemySunk.map((k) => k.index))} tone="red" className="text-[12px] sm:text-[15px]" />
              </div>

              {/* o seu mar: onde o adversário atira */}
              <div className={`bn-small rounded-xl p-[6px] ${view.phase === "battle" && view.turn === opp ? "shadow-[0_0_0_2px_rgba(248,113,113,0.8),0_0_16px_rgba(248,113,113,0.6)]" : ""}`}>
                <Sea>
                  {(view.myFleet ?? []).map((ship, i) => (
                    <SeaShip
                      key={i}
                      ship={ship}
                      index={i}
                      tone={mySunkIdx.has(i) ? "sunk" : "steel"}
                      className={mySunkIdx.has(i) && sunkAt(opp, i) >= animateFrom ? "bn-sink" : ""}
                    />
                  ))}
                  {theirShots.map((s) => {
                    const i = view.shots.indexOf(s);
                    const fresh = i >= animateFrom && i === lastIndex;
                    const last = s === theirShots.at(-1);
                    return (
                      <span key={key(s)} className="pointer-events-none absolute" style={cellStyle(s.col, s.row)}>
                        {s.hit ? <Fire out={mySunkCells.has(key(s))} className={fresh ? "bn-pop" : ""} /> : <Splash className={fresh ? "bn-pop" : ""} />}
                        {last && !fresh && <span className="absolute inset-[4%] rounded-sm ring-2 ring-red-400/70" />}
                        {fresh && <ShotFx hit={s.hit} />}
                      </span>
                    );
                  })}
                </Sea>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="relative z-20 flex justify-center px-3 pb-3">
        <span className={`flex items-center gap-1.5 font-display text-xs transition-colors ${view.canShoot || view.canPlace ? "text-gold" : "text-white/50"}`}>
          {(view.canShoot || view.canPlace) && <span className="h-2 w-2 animate-pulse rounded-full bg-gold" />}
          <span className="h-2.5 w-5">
            <ShipShape index={4} tone="gold" />
          </span>
          {room.seats[me].name}
        </span>
      </section>

      {over && showEnd && (
        <GameEnd won={view.winner === me} onLeave={leave} onAgain={room.isHost ? () => send({ t: "restart" }) : undefined}>
          <p className="font-display text-3xl">
            <span className="text-gold">{view.scores[me]}</span>
            <span className="mx-3 text-white/30">×</span>
            {view.scores[opp]}
          </p>
          <div className="flex gap-8">
            <EndStat label="TIROS" value={stats(me).shots} gold />
            <EndStat label="ACERTOS" value={`${stats(me).pct}%`} gold />
          </div>
        </GameEnd>
      )}
      {help && (
        <HowToPlayModal game="BATALHA NAVAL" onClose={() => setHelp(false)}>
          <HowToPlay />
        </HowToPlayModal>
      )}
    </main>
  );
}

function Score({ tone, value }: { tone: "gold" | "red"; value: number }) {
  return (
    <div className="flex flex-col items-center gap-0.5 leading-none">
      <span className="h-3 w-6">
        <ShipShape index={4} tone={tone} />
      </span>
      <span className={`text-3xl ${tone === "gold" ? "text-gold" : ""}`}>{value}</span>
    </div>
  );
}

/** Adversário sentado na borda de cima da mesa (meio avatar para fora). */
function Opponent({ room, seat, turn, ready }: { room: RoomInfo; seat: Seat; turn: boolean; ready: boolean }) {
  const info = room.seats[seat];
  return (
    <div className="absolute left-1/2 top-0 z-10 flex -translate-x-1/2 -translate-y-6 flex-col items-center sm:-translate-y-7 lg:-translate-y-8">
      <div className={`relative flex flex-col items-center ${info.connected ? "" : "opacity-40"}`}>
        <div
          className={`flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border-[3px] border-red-400/80 bg-stone-800 font-display text-xl text-white shadow-lg shadow-black/40 sm:h-14 sm:w-14 lg:h-16 lg:w-16 lg:text-2xl ${
            turn ? "turn-glow" : ""
          }`}
        >
          <SeatFace seat={info} />
        </div>
        {ready && (
          <span className="banner absolute -right-1 top-0 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white ring-2 ring-stone-900" title="Pronto">
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M20 6 9 17l-5-5" />
            </svg>
          </span>
        )}
        <span className="relative -mt-2 flex max-w-28 items-center gap-1 truncate rounded-full bg-stone-950/90 px-2 py-0.5 text-[11px] font-semibold ring-1 ring-white/10 lg:text-xs">
          <span className="h-2 w-4 shrink-0">
            <ShipShape index={4} tone="red" />
          </span>
          {info.name}
        </span>
      </div>
    </div>
  );
}

/** Sons a partir das mudanças da visão: assobio do tiro, água/explosão/afundou e fim de partida. */
function useSounds(view: PlayerView) {
  const prev = useRef({ game: view.gameNo, shots: view.shots.length, phase: view.phase });
  useAudioUnlock();

  useEffect(() => {
    const p = prev.current;
    prev.current = { game: view.gameNo, shots: view.shots.length, phase: view.phase };
    if (view.gameNo !== p.game || view.shots.length <= p.shots) return;
    const last = view.shots.at(-1)!;
    playWhistleSound();
    setTimeout(last.sunk !== null ? playSunkSound : last.hit ? () => playBoomSound() : playSplashSound, IMPACT_MS);
    if (view.phase === "gameOver" && p.phase !== "gameOver") {
      setTimeout(view.winner === view.seat ? playWinSound : playLoseSound, IMPACT_MS + 1100);
    }
  }, [view.gameNo, view.shots, view.phase, view.winner, view.seat]);
}

/** Mostra a tela de fim só depois de ver o último tiro e a frota revelada. */
function useEndDelay(view: PlayerView) {
  const [show, setShow] = useState(view.phase === "gameOver");
  useEffect(() => {
    if (view.phase !== "gameOver") return setShow(false);
    const t = setTimeout(() => setShow(true), 2200);
    return () => clearTimeout(t);
  }, [view.phase, view.gameNo]);
  return show;
}
