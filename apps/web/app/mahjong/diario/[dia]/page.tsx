import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Table } from "@/components/mahjong/Table";
import { getChallenge } from "@/lib/daily/db";
import { noindex } from "@/lib/seo";
import { MAHJONG_DAILY_PATH } from "@/lib/mahjong/paths";

export const metadata: Metadata = noindex;
export const dynamic = "force-dynamic";

/** Partida do desafio de um dia (hoje ou anterior). Dia sem desafio volta para o calendário. */
export default async function MahjongDailyGame({ params }: { params: Promise<{ dia: string }> }) {
  const ch = await getChallenge("mahjong", (await params).dia);
  if (ch?.game !== "mahjong") redirect(MAHJONG_DAILY_PATH);
  return <Table daily={ch} />;
}
