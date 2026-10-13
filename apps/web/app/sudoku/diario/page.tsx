import type { Metadata } from "next";
import { headers } from "next/headers";
import { DailyHub } from "@/components/daily/DailyHub";
import { LevelBars, LEVEL_LABEL } from "@/components/sudoku/common";
import { auth } from "@/lib/auth";
import { DAILY_DIFFICULTY } from "@/lib/daily/challenge";
import { dailyDone } from "@/lib/daily/db";
import { dailyMetadata } from "@/lib/seo";
import { dayKey } from "@/lib/stats/achievements";
import { SUDOKU_DAILY_PATH, SUDOKU_PATH } from "@/lib/sudoku/paths";

export const metadata: Metadata = dailyMetadata("sudoku");

export default async function SudokuDaily() {
  const session = await auth.api.getSession({ headers: await headers() });
  return (
    <DailyHub
      game="sudoku"
      name="SUDOKU"
      level={
        <>
          <LevelBars level={DAILY_DIFFICULTY} className="h-3.5 w-4 text-gold" />
          {LEVEL_LABEL[DAILY_DIFFICULTY]}
        </>
      }
      today={dayKey(new Date())}
      done={session ? await dailyDone(session.user.id, "sudoku") : {}}
      loggedIn={!!session}
      path={SUDOKU_DAILY_PATH}
      back={SUDOKU_PATH}
    />
  );
}
