"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import type { PlayerView } from "@mesa/connect4";
import type { RoomInfo } from "@mesa/truco";
import { connect, getName, send, setName, useRoom } from "@/lib/socket";
import { Lobby, type SeatGroup } from "@/components/ui/Lobby";
import { GAME_ROOM_PATH } from "@/lib/rooms";
import { Table } from "@/components/connect4/Table";
import { Disc } from "@/components/connect4/Board";
import { CONNECT4_PATH } from "@/lib/connect4/paths";
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
    if (room?.code === code && room.game !== "connect4") router.replace(GAME_ROOM_PATH[room.game](code));
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

  if (!room || room.code !== code || room.game !== "connect4") {
    return (
      <Center>
        {error ? (
          <>
            <p className="font-display text-xl text-red-300">{error}</p>
            <Link href={CONNECT4_PATH} className="rounded-xl bg-white/15 px-6 py-3 font-display">
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
        <Link href={CONNECT4_PATH} className="rounded-xl bg-white/15 px-6 py-3 font-display">
          Voltar
        </Link>
      </Center>
    );
  }
  return <Lobby room={room} groups={groups(room)} exitPath={CONNECT4_PATH} />;
}

/** Um lugar por coluna; a sua peça é sempre a dourada. */
function groups(room: RoomInfo): SeatGroup[] {
  return ([0, 1] as const).map((seat) => {
    const gold = room.mySeat === null ? seat === 0 : room.mySeat === seat;
    return {
      seats: [seat],
      color: gold ? "border-gold/40" : "border-red-400/40",
      label: <Disc color={gold ? "gold" : "red"} className="mx-auto h-6 w-6 text-[3px]" />,
    };
  });
}

function Center({ children }: { children: React.ReactNode }) {
  return <main className="mx-auto flex min-h-full max-w-sm flex-col items-center justify-center gap-5 px-4">{children}</main>;
}
