import type { Metadata } from "next";
import { headers } from "next/headers";
import { ChipsView } from "@/components/chips/ChipsView";
import { auth } from "@/lib/auth";
import { chipHistory, chipsState } from "@/lib/chips";

export const metadata: Metadata = { title: "Fichas" };

export default async function ChipsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return null;
  const [state, history] = await Promise.all([chipsState(session.user.id), chipHistory(session.user.id)]);
  if (!state) return null;
  return <ChipsView state={state} history={history} />;
}
