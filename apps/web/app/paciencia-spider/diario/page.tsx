import type { Metadata } from "next";
import { headers } from "next/headers";
import { isRed, SUIT_SETS } from "@truco/spider";
import { DailyHub } from "@/components/daily/DailyHub";
import { SuitIcon } from "@/components/spider/SpiderCard";
import { auth } from "@/lib/auth";
import { DAILY_SUITS } from "@/lib/daily/challenge";
import { dailyDone } from "@/lib/daily/db";
import { dailyMetadata } from "@/lib/seo";
import { dayKey } from "@/lib/stats/achievements";
import { SPIDER_DAILY_PATH, SPIDER_PATH } from "@/lib/spider/paths";

export const metadata: Metadata = dailyMetadata("paciencia-spider");

export default async function SpiderDaily() {
  const session = await auth.api.getSession({ headers: await headers() });
  return (
    <DailyHub
      game="paciencia-spider"
      name="PACIÊNCIA SPIDER"
      level={
        <>
          <span className="flex gap-0.5">
            {SUIT_SETS[DAILY_SUITS].map((s) => (
              <SuitIcon key={s} suit={s} className={`h-3.5 w-3.5 ${isRed(s) ? "text-red-400" : ""}`} />
            ))}
          </span>
          {DAILY_SUITS} NAIPES
        </>
      }
      today={dayKey(new Date())}
      done={session ? await dailyDone(session.user.id, "paciencia-spider") : {}}
      loggedIn={!!session}
      path={SPIDER_DAILY_PATH}
      back={SPIDER_PATH}
    />
  );
}
