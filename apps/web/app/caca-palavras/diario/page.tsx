import type { Metadata } from "next";
import { headers } from "next/headers";
import { DailyHub } from "@/components/daily/DailyHub";
import { LevelBars, LEVEL_LABEL } from "@/components/caca-palavras/common";
import { themeName } from "@mesa/caca-palavras";
import { auth } from "@/lib/auth";
import { DAILY_WORDS_LEVEL, dailyTheme } from "@/lib/daily/challenge";
import { dailyDone } from "@/lib/daily/db";
import { dailyMetadata } from "@/lib/seo";
import { dayKey } from "@/lib/stats/achievements";
import { CACA_DAILY_PATH, CACA_PATH } from "@/lib/caca-palavras/paths";

export const metadata: Metadata = dailyMetadata("caca-palavras");

export default async function CacaDaily() {
  const session = await auth.api.getSession({ headers: await headers() });
  const today = dayKey(new Date());
  return (
    <DailyHub
      game="caca-palavras"
      name="CAÇA-PALAVRAS"
      level={
        <>
          <LevelBars level={DAILY_WORDS_LEVEL} className="h-3.5 w-3.5 text-gold" />
          {LEVEL_LABEL[DAILY_WORDS_LEVEL]}
          <span className="uppercase text-white/50">· {themeName(dailyTheme(today))}</span>
        </>
      }
      today={today}
      done={session ? await dailyDone(session.user.id, "caca-palavras") : {}}
      loggedIn={!!session}
      path={CACA_DAILY_PATH}
      back={CACA_PATH}
    />
  );
}
