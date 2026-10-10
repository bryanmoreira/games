"use client";

import { useEffect, useRef, useState } from "react";
import type { PlayerView, Seat } from "@truco/game";
import { CardBack } from "./Card";

export const SHUFFLE_MS = 900;
export const CARD_MS = 110;
export const FLY_MS = 350;
const TOTAL_CARDS = 12;

type Pos = "bottom" | "right" | "top" | "left";
const POS: Pos[] = ["bottom", "right", "top", "left"];

// Destino de cada carta, relativo à mesa
const TARGET: Record<Pos, { x: string; y: string; rot: string }> = {
  bottom: { x: "50%", y: "118%", rot: "0deg" },
  top: { x: "56%", y: "4%", rot: "180deg" },
  left: { x: "6%", y: "40%", rot: "90deg" },
  right: { x: "94%", y: "40%", rot: "-90deg" },
};

export interface DealState {
  hand: number;
  stage: "shuffle" | "deal";
  dealt: number;
}

const seatForCard = (dealer: Seat, k: number) => ((dealer + 1 + k) % 4) as Seat;

/** Quantas cartas o assento já recebeu durante a distribuição. */
export function dealtTo(deal: DealState | null, dealer: Seat, seat: Seat): number {
  if (!deal) return 3;
  if (deal.stage === "shuffle") return 0;
  const offset = (seat - dealer - 1 + 4) % 4;
  return deal.dealt > offset ? Math.floor((deal.dealt - offset - 1) / 4) + 1 : 0;
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
    const at = (ms: number, fn: () => void) => timers.current.push(setTimeout(fn, ms));

    setDeal({ hand, stage: "shuffle", dealt: 0 });
    at(SHUFFLE_MS, () => setDeal({ hand, stage: "deal", dealt: 0 }));
    for (let k = 1; k <= TOTAL_CARDS; k++) {
      at(SHUFFLE_MS + (k - 1) * CARD_MS + FLY_MS, () => setDeal((d) => d && { ...d, dealt: k }));
    }
    at(SHUFFLE_MS + (TOTAL_CARDS - 1) * CARD_MS + FLY_MS + 100, () => setDeal(null));
  }, [fresh, view.handNo]);

  useEffect(
    () => () => {
      timers.current.forEach(clearTimeout);
      started.current = null;
    },
    [],
  );

  return deal;
}

export function DealAnimation({ deal, dealer, me }: { deal: DealState; dealer: Seat; me: Seat }) {
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
        : Array.from({ length: TOTAL_CARDS }).map((_, k) => {
            const seat = seatForCard(dealer, k);
            const t = TARGET[POS[(seat - me + 4) % 4]];
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
                    zIndex: TOTAL_CARDS - k,
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
