"use client";

import { useEffect, useRef, useState } from "react";
import type { PlayerView, Seat } from "@mesa/truco";
import { CardBack } from "@/components/cards/Card";

export const SHUFFLE_MS = 900;
export const CARD_MS = 110;
export const FLY_MS = 350;
const HAND = 3;

type Pos = "bottom" | "right" | "top" | "left";
const POS: Pos[] = ["bottom", "right", "top", "left"];

/** Onde o lugar aparece na mesa de quem olha; no 1×1 o adversário fica de frente. */
export function seatPos(seat: Seat, me: Seat, players: Seat[]): Pos {
  if (players.length === 2) return seat === me ? "bottom" : "top";
  return POS[(seat - me + 4) % 4];
}

// Destino de cada carta, relativo à mesa
const TARGET: Record<Pos, { x: string; y: string; rot: string }> = {
  bottom: { x: "50%", y: "118%", rot: "0deg" },
  top: { x: "50%", y: "12%", rot: "180deg" },
  left: { x: "8%", y: "50%", rot: "90deg" },
  right: { x: "92%", y: "50%", rot: "-90deg" },
};

export interface DealState {
  hand: number;
  stage: "shuffle" | "deal";
  dealt: number;
}

// as cartas saem uma a uma a partir de quem está depois do carteador
const seatForCard = (dealer: Seat, players: Seat[], k: number) => players[(players.indexOf(dealer) + 1 + k) % players.length];

/** Quantas cartas o assento já recebeu durante a distribuição. */
export function dealtTo(deal: DealState | null, dealer: Seat, seat: Seat, players: Seat[]): number {
  if (!deal) return HAND;
  if (deal.stage === "shuffle") return 0;
  const n = players.length;
  const offset = (players.indexOf(seat) - players.indexOf(dealer) - 1 + n) % n;
  return deal.dealt > offset ? Math.floor((deal.dealt - offset - 1) / n) + 1 : 0;
}

export function useDeal(view: PlayerView): DealState | null {
  const fresh =
    view.rounds.length === 1 &&
    view.rounds[0].plays.length === 0 &&
    (view.phase === "playing" || view.phase === "mao11");
  const [deal, setDeal] = useState<DealState | null>(null);
  const started = useRef<number | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    if (!fresh || started.current === view.handNo) return;
    started.current = view.handNo;
    timers.current.forEach(clearTimeout);
    const hand = view.handNo;
    const total = view.players.length * HAND;
    const at = (ms: number, fn: () => void) => timers.current.push(setTimeout(fn, ms));

    setDeal({ hand, stage: "shuffle", dealt: 0 });
    at(SHUFFLE_MS, () => setDeal({ hand, stage: "deal", dealt: 0 }));
    for (let k = 1; k <= total; k++) {
      at(SHUFFLE_MS + (k - 1) * CARD_MS + FLY_MS, () => setDeal((d) => d && { ...d, dealt: k }));
    }
    at(SHUFFLE_MS + (total - 1) * CARD_MS + FLY_MS + 100, () => setDeal(null));
  }, [fresh, view.handNo, view.players.length]);

  useEffect(
    () => () => {
      timers.current.forEach(clearTimeout);
      started.current = null;
    },
    [],
  );

  return deal;
}

export function DealAnimation({ deal, dealer, me, players }: { deal: DealState; dealer: Seat; me: Seat; players: Seat[] }) {
  const total = players.length * HAND;
  return (
    <div className="pointer-events-none absolute inset-0 z-30">
      {deal.stage === "shuffle"
        ? Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="shuffle-card absolute left-1/2 top-1/2 w-12 sm:w-16"
              style={{ "--dir": i % 2 ? 1 : -1, animationDelay: `${(i % 4) * 40}ms`, zIndex: i } as React.CSSProperties}
            >
              <CardBack />
            </div>
          ))
        : Array.from({ length: total }).map((_, k) => {
            const t = TARGET[seatPos(seatForCard(dealer, players, k), me, players)];
            return (
              <div
                key={k}
                className="fly-card absolute w-12 sm:w-16"
                style={
                  {
                    "--tx": t.x,
                    "--ty": t.y,
                    "--rot": t.rot,
                    animationDelay: `${k * CARD_MS}ms`,
                    animationDuration: `${FLY_MS}ms`,
                    zIndex: total - k,
                  } as React.CSSProperties
                }
              >
                <CardBack />
              </div>
            );
          })}
    </div>
  );
}
