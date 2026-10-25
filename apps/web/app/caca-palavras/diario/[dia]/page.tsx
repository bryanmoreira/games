import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Table } from "@/components/caca-palavras/Table";
import { getChallenge } from "@/lib/daily/db";
import { noindex } from "@/lib/seo";
import { CACA_DAILY_PATH } from "@/lib/caca-palavras/paths";

export const metadata: Metadata = noindex;
export const dynamic = "force-dynamic";

/** Partida do desafio de um dia (hoje ou anterior). Dia sem desafio volta para o calendário. */
export default async function CacaDailyGame({ params }: { params: Promise<{ dia: string }> }) {
  const ch = await getChallenge("caca-palavras", (await params).dia);
  if (ch?.game !== "caca-palavras") redirect(CACA_DAILY_PATH);
  return <Table daily={ch} />;
}
