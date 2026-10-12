import { headers } from "next/headers";
import { ProfileStatsView } from "@/components/stats/ProfileStats";
import { auth } from "@/lib/auth";
import { getProfileStats } from "@/lib/stats/summary";

export default async function ProfileSummary() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return null;
  return <ProfileStatsView stats={await getProfileStats(session.user.id)} achievements={false} />;
}
