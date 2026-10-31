"use client";

import { track } from "@/lib/analytics";

// Lembrete do desafio do dia no navegador: pede permissão, assina o push do service worker e diz ao site
// quais jogos este aparelho quer lembrar. Os jogos ficam guardados aqui também, para o sino mostrar o estado.

const GAMES_KEY = "mesa.push.games";

const vapidKey = () => window.__ENV__?.VAPID_PUBLIC_KEY;

export const pushSupported = () =>
  typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window && "Notification" in window && !!vapidKey();

export function remindedGames(): string[] {
  try {
    return JSON.parse(localStorage.getItem(GAMES_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function keyBytes(base64: string): Uint8Array<ArrayBuffer> {
  const b = atob((base64 + "=".repeat((4 - (base64.length % 4)) % 4)).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(b, (c) => c.charCodeAt(0));
}

/** Liga ou desliga o lembrete de um jogo; devolve se ficou ligado (false também quando a permissão foi negada) */
export async function setReminder(game: string, on: boolean): Promise<boolean> {
  const reg = await navigator.serviceWorker.register("/sw.js");
  await navigator.serviceWorker.ready;
  let sub = await reg.pushManager.getSubscription();
  if (on && !sub) {
    if ((await Notification.requestPermission()) !== "granted") return false;
    sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(vapidKey()!) });
  }
  const games = on ? [...new Set([...remindedGames(), game])] : remindedGames().filter((g) => g !== game);
  if (sub) {
    const r = await fetch("/api/push", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ subscription: sub.toJSON(), games }) });
    if (!r.ok) throw new Error(`push: ${r.status}`);
    if (!games.length) await sub.unsubscribe().catch(() => {});
  }
  try {
    localStorage.setItem(GAMES_KEY, JSON.stringify(games));
  } catch {}
  track(on ? "lembrete-ligado" : "lembrete-desligado", { jogo: game });
  return on;
}
