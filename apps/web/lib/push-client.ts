"use client";

import { track } from "@/lib/analytics";

// Lembrete dos desafios do dia no navegador: pede permissão, assina o push do service worker e avisa o site.
// Um lembrete só, para todos os jogos diários; o estado fica guardado aqui também, para o sino mostrar.

const GAMES_KEY = "mesa.push.games";

const vapidKey = () => window.__ENV__?.VAPID_PUBLIC_KEY;

export const pushSupported = () =>
  typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window && "Notification" in window && !!vapidKey();

/** Lembrete ligado neste aparelho (a lista antiga, por jogo, também conta) */
export function reminderOn(): boolean {
  try {
    const v = JSON.parse(localStorage.getItem(GAMES_KEY) ?? "[]");
    return (v === true || (Array.isArray(v) && v.length > 0)) && Notification.permission === "granted";
  } catch {
    return false;
  }
}

function keyBytes(base64: string): Uint8Array<ArrayBuffer> {
  const b = atob((base64 + "=".repeat((4 - (base64.length % 4)) % 4)).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(b, (c) => c.charCodeAt(0));
}

/** Liga ou desliga o lembrete; devolve se ficou ligado (false também quando a permissão foi negada). `from`: onde o sino estava. */
export async function setReminder(on: boolean, from: string): Promise<boolean> {
  const reg = await navigator.serviceWorker.register("/sw.js");
  await navigator.serviceWorker.ready;
  let sub = await reg.pushManager.getSubscription();
  if (on && !sub) {
    if ((await Notification.requestPermission()) !== "granted") return false;
    sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(vapidKey()!) });
  }
  if (sub) {
    const r = await fetch("/api/push", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ subscription: sub.toJSON(), on }) });
    if (!r.ok) throw new Error(`push: ${r.status}`);
    if (!on) await sub.unsubscribe().catch(() => {});
  }
  try {
    localStorage.setItem(GAMES_KEY, JSON.stringify(on));
  } catch {}
  track(on ? "lembrete-ligado" : "lembrete-desligado", { jogo: from });
  return on;
}
