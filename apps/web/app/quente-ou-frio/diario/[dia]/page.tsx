import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Table } from "@/components/quente-ou-frio/Table";
import { isOpenDay } from "@/lib/daily/challenge";
import { QUENTE_DAILY_PATH } from "@/lib/quente-ou-frio/paths";
import { noindex } from "@/lib/seo";

export const metadata: Metadata = noindex;
export const dynamic = "force-dynamic";

/** Palavra de um dia (hoje ou anterior). Só o dia vai para a mesa: a palavra fica no servidor. Dia sem palavra volta para o calendário. */
export default async function QuenteDailyGame({ params }: { params: Promise<{ dia: string }> }) {
  const day = (await params).dia;
  if (!isOpenDay(day)) redirect(QUENTE_DAILY_PATH);
  return <Table key={day} day={day} />;
}
