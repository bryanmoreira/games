import type { Metadata } from "next";
import { DayBars, PageTitle, Stat } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin";
import { getOverview } from "@/lib/admin-stats";

export const metadata: Metadata = { title: "Painel" };

export default async function AdminHome() {
  await requireAdmin("/admin");
  const o = await getOverview();

  return (
    <div className="flex flex-col gap-5">
      <PageTitle>Painel</PageTitle>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6">
        <Stat value={o.users} label="contas" />
        <Stat value={o.online} label="online" />
        <Stat value={o.newWeek} label="novos 7d" />
        <Stat value={o.activeWeek} label="ativos 7d" />
        <Stat value={o.matchesToday} label="partidas hoje" />
        <Stat value={o.matchesWeek} label="partidas 7d" />
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <DayBars title="Partidas" days={o.days} values={o.matches} />
        <DayBars title="Jogadores" days={o.days} values={o.players} color="fill-emerald-400" />
        <DayBars title="Cadastros" days={o.days} values={o.signups} color="fill-sky-400" />
      </div>
    </div>
  );
}
