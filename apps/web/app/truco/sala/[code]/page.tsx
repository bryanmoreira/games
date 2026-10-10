"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { connect, getName, send, setName, useTruco } from "@/lib/truco/socket";
import { Lobby } from "@/components/truco/Lobby";
import { Table } from "@/components/truco/Table";

export default function RoomPage() {
  const code = String(useParams<{ code: string }>().code).toUpperCase();
  const { room, view, error } = useTruco();
  const [named, setNamed] = useState<boolean | null>(null);
  const [name, setNameInput] = useState("");

  useEffect(() => {
    connect();
    const n = getName();
    setNamed(!!n);
    if (n) send({ t: "join", code });
  }, [code]);

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
        <input
          autoFocus
          value={name}
          onChange={(e) => setNameInput(e.target.value.slice(0, 16))}
          onKeyDown={(e) => e.key === "Enter" && confirmName()}
          placeholder="Seu nome"
          className="w-full rounded-xl bg-white/10 px-4 py-3 text-center text-lg outline-none ring-gold/60 focus:ring-2"
        />
        <button onClick={confirmName} className="w-full rounded-xl bg-gold py-3 font-display text-stone-900">
          Entrar
        </button>
      </Center>
    );
  }

  if (!room || room.code !== code) {
    return (
      <Center>
        {error ? (
          <>
            <p className="font-display text-xl text-red-300">{error}</p>
            <Link href="/truco" className="rounded-xl bg-white/15 px-6 py-3 font-display">
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
        <Link href="/truco" className="rounded-xl bg-white/15 px-6 py-3 font-display">
          Voltar
        </Link>
      </Center>
    );
  }
  return <Lobby room={room} />;
}

function Center({ children }: { children: React.ReactNode }) {
  return <main className="mx-auto flex min-h-full max-w-sm flex-col items-center justify-center gap-5 px-4">{children}</main>;
}
