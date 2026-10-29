import type { Metadata } from "next";
import { cache } from "react";
import { headers } from "next/headers";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { WoodHeader } from "@/components/home/WoodTop";
import { FriendButton } from "@/components/profile/FriendButton";
import { ShareProfileButton } from "@/components/profile/ShareProfileButton";
import { ProfileStatsView, RivalryCard } from "@/components/stats/ProfileStats";
import { profileTable } from "@/components/profile/profile-table";
import { ChipAvatar } from "@/components/ui/ChipFrame";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getFriendStatus } from "@/lib/friends";
import { canSeeProfile } from "@/lib/friends-rules";
import { getProfileStats, getRivalry } from "@/lib/stats/summary";
import { normalizeUsername } from "@/lib/username";

function LockIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="4" y="11" width="16" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  );
}

type Props = { params: Promise<{ username: string }> };

// só dados públicos: nada de e-mail
const findPlayer = cache((username: string) =>
  prisma.user.findUnique({
    where: { username: normalizeUsername(decodeURIComponent(username)) },
    select: { id: true, name: true, image: true, username: true, createdAt: true, profilePublic: true, equippedFrame: true, equippedTable: true },
  }),
);

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const player = await findPlayer((await params).username);
  if (!player) return { title: "Jogador não encontrado", robots: { index: false } };
  return { title: `${player.name} (@${player.username})`, robots: { index: false, follow: false } };
}

export default async function PublicProfile({ params }: Props) {
  const { username } = await params;
  const player = await findPlayer(username);
  if (!player) notFound();
  // /perfil/Bryan → /perfil/bryan
  if (decodeURIComponent(username) !== player.username) redirect(`/perfil/${player.username}`);

  const session = await auth.api.getSession({ headers: await headers() });
  const isMe = session?.user.id === player.id;
  const friendStatus = session && !isMe ? await getFriendStatus(session.user.id, player.id) : "none";
  const hidden = !canSeeProfile(player.profilePublic, isMe, friendStatus);
  const [stats, rivalry] = hidden
    ? [null, null]
    : await Promise.all([getProfileStats(player.id), session && !isMe ? getRivalry(session.user.id, player.id) : null]);
  const since = player.createdAt.toLocaleDateString("pt-BR", { month: "short", year: "numeric" });

  return (
    <div className="table-texture min-h-dvh bg-[#0f1813]">
      <WoodHeader title="PERFIL" heading={false} />
      <main className="mx-auto flex max-w-6xl flex-col gap-8 px-4 pb-12 pt-8 sm:gap-10">
        <header className={profileTable(player.equippedTable)}>
          <ChipAvatar user={player} frame={player.equippedFrame} className="h-24 w-24 text-3xl sm:h-32 sm:w-32 sm:text-5xl" />
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <h1 className="truncate font-display text-2xl text-gold drop-shadow-[0_2px_0_#7a4e0c] sm:text-4xl">{player.name}</h1>
            <span className="text-sm text-white/60">@{player.username}</span>
            {!hidden && (
              <span title="Membro desde" className="flex items-center gap-1.5 text-xs text-white/40">
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2.25} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="3" y="4" width="18" height="18" rx="2" />
                  <path d="M16 2v4M8 2v4M3 10h18" />
                </svg>
                {since}
              </span>
            )}
            <div className="mt-2 flex flex-wrap gap-2">
              {!isMe && <FriendButton username={player.username!} initial={friendStatus} loggedIn={!!session} />}
              {!hidden && <ShareProfileButton name={player.name} />}
              {isMe && (
                <Link
                  href="/perfil"
                  className="flex h-9 items-center gap-2 rounded-full bg-white/10 px-4 text-xs text-white/80 ring-1 ring-white/10 transition hover:bg-white/20 hover:text-white"
                >
                  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2.25} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M17 3a2.8 2.8 0 0 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                  </svg>
                  Editar
                </Link>
              )}
              {isMe && !player.profilePublic && (
                <span title="Só você e seus amigos veem este perfil" className="flex h-9 items-center gap-1.5 rounded-full px-3 text-xs text-white/50 ring-1 ring-white/10">
                  <LockIcon className="h-3.5 w-3.5" />
                  Privado
                </span>
              )}
            </div>
          </div>
        </header>

        {hidden ? (
          <section className="flex flex-col items-center gap-3 rounded-2xl bg-white/5 px-4 py-12 text-white/40 ring-1 ring-white/10">
            <LockIcon className="h-10 w-10" />
            <span className="font-display text-sm">PERFIL PRIVADO</span>
          </section>
        ) : (
          <>
            {rivalry && <RivalryCard rivalry={rivalry} them={player.username!} />}
            <ProfileStatsView stats={stats!} />
          </>
        )}
      </main>
    </div>
  );
}
