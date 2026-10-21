"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { seatColors, type PlayerView } from "@mesa/ludo";
import type { RoomInfo } from "@mesa/truco";
import { connect, getName, send, setName, useRoom } from "@/lib/socket";
import { Lobby, type SeatGroup } from "@/components/ui/Lobby";
import { GAME_ROOM_PATH } from "@/lib/rooms";
import { Table } from "@/components/ludo/Table";
import { Pawn } from "@/components/ludo/Board";
import { LUDO_PATH } from "@/lib/ludo/paths";
import { PlayerName } from "@/components/ui/PlayerName";

export default function RoomPage() {
  const code = String(useParams<{ code: string }>().code).toUpperCase();
  const router = useRouter();
  const { room, view, error } = useRoom<PlayerView>();
  const [named, setNamed] = useState<boolean | null>(null);
  const [name, setNameInput] = useState("");

  useEffect(() => {
    connect();
    const n = getName();
    setNamed(!!n);
    if (n) send({ t: "join", code });
  }, [code]);

  // código de sala de outro jogo: vai para a rota certa
  useEffect(() => {
    if (room?.code === code && room.game !== "ludo") router.replace(GAME_ROOM_PATH[room.game](code));
  }, [room, code, router]);

  const confirmName = () => {
    if (!name.trim()) return;
    setName(name.trim());
    setNamed(true);
    send({ t: "join", code });
  };

  if (named === false) {
    return (
      <Center>
        <h1 className="font-display text-3xl text-gold">{code}</h1>
        <PlayerName autoFocus value={name} onChange={setNameInput} onEnter={confirmName} />
        <button onClick={confirmName} className="w-full rounded-xl bg-gold py-3 font-display text-stone-900">
          Entrar
        </button>
      </Center>
    );
  }

  if (!room || room.code !== code || room.game !== "ludo") {
    return (
      <Center>
        {error ? (
          <>
            <p className="font-display text-xl text-red-300">{error}</p>
            <Link href={LUDO_PATH} className="rounded-xl bg-white/15 px-6 py-3 font-display">
              Voltar
            </Link>
          </>
        ) : (
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-gold border-t-transparent" />
        )}
      </Center>
    );
  }

  if (room.started && view) return <Table room={room} view={view} />;
  if (room.started) {
    return (
      <Center>
        <p className="font-display text-xl">Partida em andamento</p>
        <Link href={LUDO_PATH} className="rounded-xl bg-white/15 px-6 py-3 font-display">
          Voltar
        </Link>
      </Center>
    );
  }
  return <Lobby room={room} groups={groups(room)} exitPath={LUDO_PATH} />;
}

// borda da coluna de cada lugar, na cor do lugar
const BORDERS = ["border-[#e5484d]/50", "border-[#2fb36b]/50", "border-[#f0b429]/50", "border-[#3e7bfa]/50"];

/** Um lugar por coluna, cada um com a sua cor (com 2 sentados, o segundo já aparece com a cor oposta). */
function groups(room: RoomInfo): SeatGroup[] {
  const sat = room.seats.flatMap((s, i) => (s.kind === "empty" ? [] : [i]));
  const colors = sat.length === 2 ? seatColors(sat) : [];
  return room.seats.map((_, s) => ({ seat: s, color: colors[s] ?? s })).map(({ seat, color }) => ({
    seats: [seat],
    color: BORDERS[color],
    label: <Pawn color={color} dim={room.seats[seat].kind === "empty"} className="mx-auto h-7 w-7" />,
  }));
}

function Center({ children }: { children: React.ReactNode }) {
  return <main className="mx-auto flex min-h-full max-w-sm flex-col items-center justify-center gap-5 px-4">{children}</main>;
}
