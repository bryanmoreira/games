import type { Metadata } from "next";
import { headers } from "next/headers";
import { layoutName } from "@mesa/mahjong";
import { DailyHub } from "@/components/daily/DailyHub";
import { auth } from "@/lib/auth";
import { dailyDone, getChallenge } from "@/lib/daily/db";
import { dailyMetadata } from "@/lib/seo";
import { dayKey } from "@/lib/stats/achievements";
import { MAHJONG_DAILY_PATH, MAHJONG_PATH } from "@/lib/mahjong/paths";

export const metadata: Metadata = dailyMetadata("mahjong");

export default async function MahjongDaily() {
  const session = await auth.api.getSession({ headers: await headers() });
  const today = dayKey(new Date());
  // o formato sai do sorteio do dia (o primeiro acesso do dia gera o desafio)
  const ch = await getChallenge("mahjong", today);
  return (
    <DailyHub
      game="mahjong"
      name="MAHJONG"
      level={<span className="uppercase">{ch?.game === "mahjong" ? layoutName(ch.data.layout) : "144 peças"}</span>}
      today={today}
      done={session ? await dailyDone(session.user.id, "mahjong") : {}}
      loggedIn={!!session}
      path={MAHJONG_DAILY_PATH}
      back={MAHJONG_PATH}
    />
  );
}
