import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Table } from "@/components/spider/Table";
import { getChallenge } from "@/lib/daily/db";
import { noindex } from "@/lib/seo";
import { SPIDER_DAILY_PATH } from "@/lib/spider/paths";

export const metadata: Metadata = noindex;
export const dynamic = "force-dynamic";

/** Partida do desafio de um dia (hoje ou anterior). Dia sem desafio volta para o calendário. */
export default async function SpiderDailyGame({ params }: { params: Promise<{ dia: string }> }) {
  const ch = await getChallenge("paciencia-spider", (await params).dia);
  if (ch?.game !== "paciencia-spider") redirect(SPIDER_DAILY_PATH);
  return <Table daily={ch} />;
}
