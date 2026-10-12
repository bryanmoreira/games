import type { Metadata } from "next";
import { headers } from "next/headers";
import { FriendsView } from "@/components/profile/FriendsView";
import { auth } from "@/lib/auth";
import { listFriends } from "@/lib/friends";

export const metadata: Metadata = { title: "Amigos" };

export default async function FriendsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return null;
  return <FriendsView {...await listFriends(session.user.id)} />;
}
