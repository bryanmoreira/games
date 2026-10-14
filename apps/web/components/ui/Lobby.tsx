"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { GameId, RoomInfo } from "@truco/game";
import { send } from "@/lib/socket";
import { WhatsAppInvite } from "@/components/ui/WhatsAppInvite";
import { FriendInvite } from "@/components/ui/FriendInvite";
import { SeatFace } from "@/components/ui/SeatFace";

/** Chamada da mensagem de convite de cada jogo online */
const INVITE: Record<GameId, string> = {
  "truco-paulista": "Bora jogar um truco? 🃏",
  connect4: "Duvido você me ganhar no Connect 4! 🔴🟡",
  stop: "Bora jogar Stop (Adedonha)? ✋",
  "batalha-naval": "Bora jogar Batalha Naval? 🚢",
  codenames: "Bora jogar Codenames? 🕵️",
  otrio: "Bora jogar Otrio? Duvido fazer trinca antes de mim! 🎯",
  "jogo-da-velha": "Bora um jogo da velha? Duvido me ganhar! ❌⭕",
  damas: "Bora uma partida de damas? Duvido chegar a dama antes de mim! ⚫⚪",
};

/** Uma coluna do lobby: os lugares de um time (ou de um jogador). */
export interface SeatGroup {
  seats: number[];
  color: string;
  label?: React.ReactNode;
  /**
   * Lugares divididos por papel (ex.: mestre/agentes no Codenames). Cada parte mostra só quem sentou
   * e um "Sentar" para o próximo lugar livre, em vez de todos os lugares vazios.
   */
  sections?: { label: React.ReactNode; seats: number[] }[];
}

/** Duplas do truco: 0/2 contra 1/3. */
export const TEAMS_2X2: SeatGroup[] = [
  { seats: [0, 2], color: "text-team-a border-team-a/40", label: "Time 1" },
  { seats: [1, 3], color: "text-team-b border-team-b/40", label: "Time 2" },
];

/**
 * Lobby de sala de qualquer jogo online: código para copiar, lugares por coluna, IA e Começar.
 * `children` entra abaixo dos lugares (opções da partida, ex.: Stop).
 */
export function Lobby({
  room,
  groups,
  exitPath,
  children,
}: {
  room: RoomInfo;
  groups: SeatGroup[];
  exitPath: string;
  children?: React.ReactNode;
}) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(location.href).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const leave = () => {
    send({ t: "leave" });
    router.push(exitPath);
  };

  return (
    <main className="mx-auto flex min-h-full max-w-3xl flex-col items-center justify-center gap-8 px-4 py-8">
      <div className="flex flex-col items-center gap-4">
        <button onClick={copy} className="group flex flex-col items-center gap-1" title="Copiar link">
          <span className="font-display text-6xl tracking-[0.2em] text-gold">{room.code}</span>
          <span className="text-sm text-white/50 group-hover:text-white/80">{copied ? "✓ link copiado" : "🔗 copiar link"}</span>
        </button>
        <div className="flex flex-wrap justify-center gap-3">
          <WhatsAppInvite
            campaign={room.game}
            message={(url) => `${INVITE[room.game]} Entra na minha sala (${room.code}): ${url}`}
          />
          <FriendInvite room={room} />
        </div>
      </div>

      <div className="grid w-full grid-cols-2 gap-4">
        {groups.map((team, i) => (
          <div key={i} className={`flex flex-col gap-3 rounded-2xl border-2 bg-white/5 p-3 ${team.color}`}>
            {team.label && <h2 className="text-center font-display">{team.label}</h2>}
            {team.sections
              ? team.sections.map((sec, j) => <Section key={j} room={room} label={sec.label} seats={sec.seats} />)
              : team.seats.map((seat) => <SeatSlot key={seat} room={room} seat={seat} />)}
          </div>
        ))}
      </div>

      {room.waiting.length > 0 && (
        <div className="flex flex-wrap justify-center gap-2">
          {room.waiting.map((n, i) => (
            <span key={i} className="rounded-full bg-white/10 px-3 py-1 text-sm text-white/70">
              👀 {n}
            </span>
          ))}
        </div>
      )}

      {children}

      <div className="flex w-full gap-3">
        <button onClick={leave} className="rounded-xl bg-white/10 px-5 py-3 font-display hover:bg-white/20">
          ✕
        </button>
        {room.isHost ? (
          <button
            disabled={!room.canStart}
            onClick={() => send({ t: "start" })}
            className="flex-1 rounded-xl bg-gold py-3 font-display text-lg text-stone-900 shadow-[0_4px_0_#9a6b12] active:translate-y-1 active:shadow-none disabled:opacity-40"
          >
            Começar
          </button>
        ) : (
          <div className="flex flex-1 items-center justify-center rounded-xl bg-white/5 text-white/50">⏳</div>
        )}
      </div>
    </main>
  );
}

/** Parte de uma coluna: quem sentou e um lugar livre. */
function Section({ room, label, seats }: { room: RoomInfo; label: React.ReactNode; seats: number[] }) {
  const taken = seats.filter((s) => room.seats[s].kind !== "empty");
  const free = seats.find((s) => room.seats[s].kind === "empty");
  return (
    <div className="flex flex-col gap-2">
      <span className="flex items-center gap-1.5 font-display text-xs opacity-80">{label}</span>
      {taken.map((seat) => (
        <SeatSlot key={seat} room={room} seat={seat} />
      ))}
      {free !== undefined && <SeatSlot room={room} seat={free} />}
    </div>
  );
}

function SeatSlot({ room, seat }: { room: RoomInfo; seat: number }) {
  const s = room.seats[seat];
  const mine = room.mySeat === seat;

  if (s.kind === "empty") {
    return (
      <div className="flex h-14 gap-2">
        <button
          onClick={() => send({ t: "sit", seat })}
          className="flex-1 rounded-xl border-2 border-dashed border-white/20 text-white/60 transition hover:border-white/50 hover:text-white"
        >
          Sentar
        </button>
        {room.isHost && room.bots && (
          <button
            onClick={() => send({ t: "addBot", seat })}
            className="w-12 rounded-xl bg-white/10 text-xl transition hover:bg-white/20"
            title="Adicionar IA"
          >
            🤖
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      className={`flex h-14 items-center gap-2 rounded-xl px-3 text-white ${mine ? "bg-gold/25 ring-2 ring-gold" : "bg-white/10"} ${
        s.connected ? "" : "opacity-50"
      }`}
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-black/25 font-display text-base">
        {s.kind === "human" && !s.image ? "🙂" : <SeatFace seat={s} />}
      </span>
      <span className="flex-1 truncate font-semibold">{s.name}</span>
      {s.kind === "bot" && room.isHost && (
        <button onClick={() => send({ t: "removeBot", seat })} className="text-white/50 hover:text-white">
          ✕
        </button>
      )}
      {mine && (
        <button onClick={() => send({ t: "stand" })} className="text-white/50 hover:text-white" title="Levantar">
          ↩
        </button>
      )}
    </div>
  );
}
