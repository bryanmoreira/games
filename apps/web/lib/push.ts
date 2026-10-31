import webpush from "web-push";
import { prisma } from "@/lib/db";
import { DAILY_SEO, getGame } from "@/lib/seo";
import { dayNumber } from "@/lib/daily/challenge";
import { dayKey } from "@/lib/stats/achievements";

// Lembrete do desafio do dia (Web Push). Chaves VAPID no ambiente: VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY e
// VAPID_SUBJECT (mailto:). Gerar com: bunx web-push generate-vapid-keys. Sem elas, o lembrete fica desligado.

const env = (name: string) => process.env[name] || undefined;

export const pushPublicKey = () => env(["VAPID", "PUBLIC", "KEY"].join("_"));

function configured(): boolean {
  const pub = pushPublicKey();
  const priv = env(["VAPID", "PRIVATE", "KEY"].join("_"));
  if (!pub || !priv) return false;
  webpush.setVapidDetails(env("VAPID_SUBJECT") ?? "mailto:contato@mesadejogos.com", pub, priv);
  return true;
}

export const DAILY_GAMES_PUSH = Object.keys(DAILY_SEO);

export interface SubscriptionInput {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}

/** Serviços de push dos navegadores (Chrome, Firefox, Safari, Edge): o servidor só manda para eles */
const PUSH_HOSTS = [/^fcm\.googleapis\.com$/, /^updates\.push\.services\.mozilla\.com$/, /(^|\.)push\.apple\.com$/, /\.notify\.windows\.com$/];

export function isSubscription(v: unknown): v is SubscriptionInput {
  const s = v as SubscriptionInput;
  if (!s || typeof s.endpoint !== "string" || s.endpoint.length > 1000 || typeof s.keys?.p256dh !== "string" || typeof s.keys?.auth !== "string") return false;
  if (s.keys.p256dh.length > 200 || s.keys.auth.length > 100) return false;
  try {
    const u = new URL(s.endpoint);
    return u.protocol === "https:" && PUSH_HOSTS.some((h) => h.test(u.hostname));
  } catch {
    return false;
  }
}

/** Liga (ou atualiza) o lembrete do aparelho para os jogos pedidos; sem jogos, apaga */
export async function saveSubscription(s: SubscriptionInput, games: string[], userId: string | null) {
  const list = [...new Set(games.filter((g) => DAILY_GAMES_PUSH.includes(g)))];
  if (!list.length) return prisma.pushSubscription.deleteMany({ where: { endpoint: s.endpoint } });
  return prisma.pushSubscription.upsert({
    where: { endpoint: s.endpoint },
    create: { endpoint: s.endpoint, p256dh: s.keys.p256dh, auth: s.keys.auth, games: list, userId },
    update: { p256dh: s.keys.p256dh, auth: s.keys.auth, games: list, ...(userId ? { userId } : {}) },
  });
}

/** Texto do lembrete: um jogo diz qual é; vários, quantos */
export function dailyMessage(games: string[], day: string): { title: string; body: string; url: string } {
  const n = dayNumber(day);
  if (games.length === 1) {
    const g = getGame(games[0]);
    return { title: `${g.name} do dia #${n}`, body: "O desafio de hoje já está no ar. Bora manter a sequência?", url: `${g.path}/diario` };
  }
  const names = games.map((s) => getGame(s).name);
  return { title: `Desafios do dia #${n}`, body: `${names.slice(0, -1).join(", ")} e ${names[names.length - 1]} já estão no ar.`, url: "/" };
}

/** Manda o lembrete do dia para todos os aparelhos. Inscrição que o navegador desfez (404/410) é apagada. */
export async function sendDailyPush(): Promise<{ sent: number; removed: number } | null> {
  if (!configured()) return null;
  const day = dayKey(new Date());
  const subs = await prisma.pushSubscription.findMany();
  let sent = 0;
  const gone: string[] = [];
  for (const s of subs) {
    const msg = dailyMessage(s.games, day);
    try {
      await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, JSON.stringify({ ...msg, tag: `diario-${day}` }), { TTL: 6 * 3600 });
      sent++;
    } catch (e) {
      const code = (e as { statusCode?: number }).statusCode;
      if (code === 404 || code === 410) gone.push(s.id);
    }
  }
  if (gone.length) await prisma.pushSubscription.deleteMany({ where: { id: { in: gone } } });
  return { sent, removed: gone.length };
}
