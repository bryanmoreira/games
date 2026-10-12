import type { Metadata } from "next";
import { headers } from "next/headers";
import { AchievementsView } from "@/components/stats/ProfileStats";
import { auth } from "@/lib/auth";
import { getProfileStats } from "@/lib/stats/summary";

export const metadata: Metadata = { title: "Conquistas" };

export default async function AchievementsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return null;
  return <AchievementsView stats={await getProfileStats(session.user.id)} />;
}
