import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Table } from "@/components/sudoku/Table";
import { getChallenge } from "@/lib/daily/db";
import { noindex } from "@/lib/seo";
import { SUDOKU_DAILY_PATH } from "@/lib/sudoku/paths";

export const metadata: Metadata = noindex;
export const dynamic = "force-dynamic";

/** Partida do desafio de um dia (hoje ou anterior). Dia sem desafio volta para o calendário. */
export default async function SudokuDailyGame({ params }: { params: Promise<{ dia: string }> }) {
  const ch = await getChallenge("sudoku", (await params).dia);
  if (ch?.game !== "sudoku") redirect(SUDOKU_DAILY_PATH);
  return <Table daily={ch} />;
}
