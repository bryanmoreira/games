import { msToHour, msToMidnight } from "./midnight";
import { callSite } from "./results";

// Agendador do desafio diário: à meia-noite de Brasília pede ao site para gerar o desafio do dia
// (e os dias que faltarem). Também roda ao subir, para cobrir deploy e queda. Se falhar, tenta de novo
// em alguns minutos; e se nada disso rodar, o site gera o desafio no primeiro acesso do dia.

const RETRY = 5 * 60_000;

async function run(): Promise<boolean> {
  const r = await callSite("/api/internal/daily");
  if (!r?.ok) {
    console.error(`desafio diário: ${r ? `${r.status} ${await r.text()}` : "site fora do ar ou sem GAME_SECRET"}`);
    return false;
  }
  const { created } = (await r.json()) as { created: { game: string; day: string }[] };
  if (created.length) console.log(`desafio diário: ${created.map((c) => `${c.game} ${c.day}`).join(", ")}`);
  return true;
}

export function startDailyScheduler() {
  if (!process.env.GAME_SECRET) return console.warn("GAME_SECRET vazio: desafio diário só será gerado no primeiro acesso");
  const loop = async () => {
    const ok = await run();
    // se falhou e a meia-noite ainda está longe, tenta de novo antes
    setTimeout(loop, ok ? msToMidnight() : Math.min(RETRY, msToMidnight()));
  };
  // espera o site subir junto (deploy dos dois serviços ao mesmo tempo)
  setTimeout(loop, 10_000);
}

/** Hora do lembrete do desafio do dia (Brasília) */
const PUSH_HOUR = 10;

/** De manhã, pede ao site para mandar o lembrete do desafio do dia (Web Push) a quem ligou o sino. */
export function startPushScheduler() {
  if (!process.env.GAME_SECRET) return;
  const loop = async () => {
    const r = await callSite("/api/internal/push");
    if (r?.ok) {
      const { sent, removed } = (await r.json()) as { sent: number; removed: number };
      console.log(`lembrete do dia: ${sent} enviados, ${removed} inscrições apagadas`);
    } else if (r && r.status !== 503) console.error(`lembrete do dia: ${r.status}`);
    setTimeout(loop, msToHour(PUSH_HOUR) + 1000);
  };
  setTimeout(loop, msToHour(PUSH_HOUR) + 1000);
}
