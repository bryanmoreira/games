import type { Metadata } from "next";
import { CARD, Meter, PageTitle, Stat, Tabs } from "@/components/admin/ui";
import { AchievementIcon } from "@/components/stats/AchievementIcon";
import { requireAdmin } from "@/lib/admin";
import { pct } from "@/lib/admin-rules";
import { getAchievementCounts } from "@/lib/admin-stats";
import { STAT_GAMES, GAME_INFO } from "@/lib/stats/games";

export const metadata: Metadata = { title: "Conquistas" };

type Item = Awaited<ReturnType<typeof getAchievementCounts>>[number];
type Order = "jogo" | "raras";

const ORDER_TABS: [Order, string][] = [
  ["jogo", "Por jogo"],
  ["raras", "Mais raras"],
];

function Row({ a, game }: { a: Item; game?: boolean }) {
  const p = pct(a.count, a.base);
  const none = a.count === 0;
  return (
    <li className={`${CARD} flex items-center gap-3 px-4 py-2.5`}>
      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${none ? "bg-white/5 text-white/30" : "bg-gold/15 text-gold"}`}>
        <AchievementIcon icon={a.def.icon} className="h-4.5 w-4.5" />
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-baseline justify-between gap-3">
          <span className="truncate text-sm text-white/90" title={a.def.desc}>
            {a.def.title}
            {game && <span className="ml-2 text-xs text-white/40">{a.def.game ? GAME_INFO[a.def.game].name : "Geral"}</span>}
          </span>
          <span className="shrink-0 text-xs tabular-nums text-white/50" title={`${a.count} de ${a.base} jogadores`}>
            <span className={none ? "text-orange-300" : "text-white/90"}>{a.count}</span>
            {p !== null && <span className="ml-1.5">{p}%</span>}
          </span>
        </div>
        <span className="truncate text-xs text-white/40">{a.def.desc}</span>
        <Meter value={p} />
      </div>
    </li>
  );
}

export default async function AdminAchievements({ searchParams }: { searchParams: Promise<{ o?: string }> }) {
  await requireAdmin("/admin/conquistas");
  const order: Order = (await searchParams).o === "raras" ? "raras" : "jogo";
  const items = await getAchievementCounts();
  const unlocks = items.reduce((a, i) => a + i.count, 0);
  const never = items.filter((i) => i.count === 0).length;

  const groups = [
    { key: "geral", name: "Geral", list: items.filter((i) => i.def.game === null) },
    ...STAT_GAMES.map((g) => ({ key: g, name: GAME_INFO[g].name, list: items.filter((i) => i.def.game === g) })),
  ].filter((g) => g.list.length);
  // mais raras: menor % entre quem jogou o jogo (jogos sem ninguém vão para o fim)
  const rare = [...items].sort((a, b) => (pct(a.count, a.base) ?? 101) - (pct(b.count, b.base) ?? 101) || a.count - b.count);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <PageTitle>Conquistas</PageTitle>
        <Tabs items={ORDER_TABS} active={order} href={(o) => (o === "jogo" ? "/admin/conquistas" : "/admin/conquistas?o=raras")} />
      </div>

      <div className="grid grid-cols-3 gap-2 sm:max-w-md">
        <Stat value={items.length} label="conquistas" />
        <Stat value={unlocks} label="desbloqueios" />
        <Stat value={never} label="ninguém tem" />
      </div>

      {order === "raras" ? (
        <ul className="grid gap-2 xl:grid-cols-2">
          {rare.map((a) => (
            <Row key={a.def.code} a={a} game />
          ))}
        </ul>
      ) : (
        groups.map((g) => (
          <section key={g.key} className="flex flex-col gap-3">
            <h2 className="flex items-center justify-between font-display text-sm text-white/80">
              {g.name.toUpperCase()}
              <span className="text-xs tabular-nums text-white/40">{g.list[0].base} jogadores</span>
            </h2>
            <ul className="grid gap-2 xl:grid-cols-2">
              {g.list.map((a) => (
                <Row key={a.def.code} a={a} />
              ))}
            </ul>
          </section>
        ))
      )}
    </div>
  );
}
