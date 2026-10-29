import type { Metadata } from "next";
import { headers } from "next/headers";
import { DailyHub } from "@/components/daily/DailyHub";
import { CalendarIcon } from "@/components/ui/icons";
import { auth } from "@/lib/auth";
import { dailyDone } from "@/lib/daily/db";
import { QUENTE_DAILY_PATH, QUENTE_PATH } from "@/lib/quente-ou-frio/paths";
import { dailyMetadata } from "@/lib/seo";
import { dayKey } from "@/lib/stats/achievements";

export const metadata: Metadata = dailyMetadata("quente-ou-frio");

export default async function QuenteDaily() {
  const session = await auth.api.getSession({ headers: await headers() });
  return (
    <DailyHub
      game="quente-ou-frio"
      name="QUENTE OU FRIO"
      level={
        <>
          <CalendarIcon className="h-3.5 w-3.5 text-gold" />
          PALAVRA DO DIA
        </>
      }
      today={dayKey(new Date())}
      done={session ? await dailyDone(session.user.id, "quente-ou-frio", "attempts") : {}}
      loggedIn={!!session}
      path={QUENTE_DAILY_PATH}
      back={QUENTE_PATH}
      unit="attempts"
    />
  );
}
