"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { agentSeats, masterSeats, type PlayerView } from "@mesa/codenames";
import { connect, getName, send, setName, useRoom } from "@/lib/socket";
import { Lobby, type SeatGroup } from "@/components/ui/Lobby";
import { GAME_ROOM_PATH } from "@/lib/rooms";
import { Table } from "@/components/codenames/Table";
import { CodenamesSettings } from "@/components/codenames/Settings";
import { AgentIcon, EyeIcon, TEAM } from "@/components/codenames/Board";
import { CODENAMES_PATH } from "@/lib/codenames/paths";
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
    if (room?.code === code && room.game !== "codenames") router.replace(GAME_ROOM_PATH[room.game](code));
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

  if (!room || room.code !== code || room.game !== "codenames") {
    return (
      <Center>
        {error ? (
          <>
            <p className="font-display text-xl text-red-300">{error}</p>
            <Link href={CODENAMES_PATH} className="rounded-xl bg-white/15 px-6 py-3 font-display">
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
        <Link href={CODENAMES_PATH} className="rounded-xl bg-white/15 px-6 py-3 font-display">
          Voltar
        </Link>
      </Center>
    );
  }
  return (
    <Lobby room={room} groups={GROUPS} exitPath={CODENAMES_PATH}>
      <CodenamesSettings room={room} />
    </Lobby>
  );
}

/** Um time por coluna: o mestre e até 5 agentes. */
const GROUPS: SeatGroup[] = ([0, 1] as const).map((team) => ({
  seats: [...masterSeats(team), ...agentSeats(team)],
  color: `${TEAM[team].text} ${TEAM[team].border}`,
  label: TEAM[team].name,
  sections: [
    {
      label: (
        <>
          <EyeIcon className="h-4 w-4" />
          MESTRE
        </>
      ),
      seats: masterSeats(team),
    },
    {
      label: (
        <>
          <AgentIcon className="h-4 w-4" />
          AGENTES
        </>
      ),
      seats: agentSeats(team),
    },
  ],
}));

function Center({ children }: { children: React.ReactNode }) {
  return <main className="mx-auto flex min-h-full max-w-sm flex-col items-center justify-center gap-5 px-4">{children}</main>;
}
