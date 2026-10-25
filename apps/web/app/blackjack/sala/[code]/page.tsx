"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ROUND_OPTIONS, type PlayerView, type Settings } from "@mesa/blackjack";
import type { RoomInfo } from "@mesa/truco";
import { connect, getName, send, setName, useRoom } from "@/lib/socket";
import { Lobby, type SeatGroup } from "@/components/ui/Lobby";
import { Row, Segmented } from "@/components/ui/Options";
import { GAME_ROOM_PATH } from "@/lib/rooms";
import { Table } from "@/components/blackjack/Table";
import { BLACKJACK_PATH } from "@/lib/blackjack/paths";
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
    if (room?.code === code && room.game !== "blackjack") router.replace(GAME_ROOM_PATH[room.game](code));
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

  if (!room || room.code !== code || room.game !== "blackjack") {
    return (
      <Center>
        {error ? (
          <>
            <p className="font-display text-xl text-red-300">{error}</p>
            <Link href={BLACKJACK_PATH} className="rounded-xl bg-white/15 px-6 py-3 font-display">
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
        <Link href={BLACKJACK_PATH} className="rounded-xl bg-white/15 px-6 py-3 font-display">
          Voltar
        </Link>
      </Center>
    );
  }
  return (
    <Lobby room={room} groups={GROUPS} exitPath={BLACKJACK_PATH}>
      <RoundsSetting room={room} />
    </Lobby>
  );
}

/** Cada lugar numa coluna: todos jogam contra a banca, sem times. */
const GROUPS: SeatGroup[] = [0, 1, 2, 3, 4].map((seat) => ({ seats: [seat], color: "border-white/15" }));

/** Quantas mãos tem a partida: o host escolhe, os outros só veem. */
function RoundsSetting({ room }: { room: RoomInfo }) {
  const s = room.settings as Settings;
  return (
    <div className="flex w-full flex-col gap-4 rounded-2xl bg-white/5 p-3 ring-1 ring-white/10 sm:p-4">
      <Row icon={null} label="MÃOS">
        <Segmented
          options={ROUND_OPTIONS}
          value={s.rounds}
          disabled={!room.isHost}
          onPick={(rounds) => send({ t: "settings", settings: { ...s, rounds } })}
          render={(r) => r}
        />
      </Row>
    </div>
  );
}

function Center({ children }: { children: React.ReactNode }) {
  return <main className="mx-auto flex min-h-full max-w-sm flex-col items-center justify-center gap-5 px-4">{children}</main>;
}
