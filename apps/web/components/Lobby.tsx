"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { RoomInfo, Seat } from "@truco/game";
import { send } from "@/lib/socket";

const TEAMS: { seats: Seat[]; color: string; label: string }[] = [
  { seats: [0, 2], color: "text-team-a border-team-a/40", label: "Time 1" },
  { seats: [1, 3], color: "text-team-b border-team-b/40", label: "Time 2" },
];

export function Lobby({ room }: { room: RoomInfo }) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const full = room.seats.every((s) => s.kind !== "empty");

  const copy = async () => {
    await navigator.clipboard.writeText(location.href).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const leave = () => {
    send({ t: "leave" });
    router.push("/");
  };

  return (
    <main className="mx-auto flex min-h-full max-w-xl flex-col items-center justify-center gap-8 px-4 py-8">
      <button onClick={copy} className="group flex flex-col items-center gap-1" title="Copiar link">
        <span className="font-display text-6xl tracking-[0.2em] text-gold">{room.code}</span>
        <span className="text-sm text-white/50 group-hover:text-white/80">{copied ? "✓ link copiado" : "🔗 copiar link"}</span>
      </button>

      <div className="grid w-full grid-cols-2 gap-4">
        {TEAMS.map((team) => (
          <div key={team.label} className={`flex flex-col gap-3 rounded-2xl border-2 bg-white/5 p-3 ${team.color}`}>
            <h2 className="text-center font-display">{team.label}</h2>
            {team.seats.map((seat) => (
              <SeatSlot key={seat} room={room} seat={seat} />
            ))}
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

      <div className="flex w-full gap-3">
        <button onClick={leave} className="rounded-xl bg-white/10 px-5 py-3 font-display hover:bg-white/20">
          ✕
        </button>
        {room.isHost ? (
          <button
            disabled={!full}
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

function SeatSlot({ room, seat }: { room: RoomInfo; seat: Seat }) {
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
        {room.isHost && (
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
      <span className="text-xl">{s.kind === "bot" ? "🤖" : "🙂"}</span>
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
