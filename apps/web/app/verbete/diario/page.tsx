import type { Metadata } from "next";
import { headers } from "next/headers";
import { Calendar } from "@/components/verbete/Calendar";
import { auth } from "@/lib/auth";
import { verbeteDone } from "@/lib/daily/db";
import { dailyMetadata } from "@/lib/seo";
import { dayKey } from "@/lib/stats/achievements";

export const metadata: Metadata = dailyMetadata("verbete");

export default async function VerbeteDaily() {
  const session = await auth.api.getSession({ headers: await headers() });
  return <Calendar today={dayKey(new Date())} done={session ? await verbeteDone(session.user.id) : {}} loggedIn={!!session} />;
}
