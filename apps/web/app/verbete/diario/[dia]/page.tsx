import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { isMode, type Mode } from "@truco/verbete";
import { Table } from "@/components/verbete/Table";
import { getChallenge } from "@/lib/daily/db";
import { noindex } from "@/lib/seo";
import { VERBETE_DAILY_PATH } from "@/lib/verbete/paths";

export const metadata: Metadata = noindex;
export const dynamic = "force-dynamic";

/** Palavras de um dia (hoje ou anterior); `?m=2` ou `?m=4` para Dueto e Quarteto. Dia sem palavras volta para o calendário. */
export default async function VerbeteDailyGame({ params, searchParams }: { params: Promise<{ dia: string }>; searchParams: Promise<{ m?: string }> }) {
  const ch = await getChallenge("verbete", (await params).dia);
  if (ch?.game !== "verbete") redirect(VERBETE_DAILY_PATH);
  const m = Number((await searchParams).m);
  const mode: Mode = isMode(m) ? m : 1;
  return <Table key={`${ch.day}-${mode}`} mode={mode} daily={{ day: ch.day, data: ch.data }} />;
}
