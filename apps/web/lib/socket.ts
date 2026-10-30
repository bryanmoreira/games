"use client";

import { useSyncExternalStore } from "react";
import type { ClientMsg, RoomInfo, ServerMsg } from "@mesa/truco";
import { track } from "@/lib/analytics";

// Conexão única com o servidor de salas, compartilhada por todos os jogos online.
// Uma identidade por aba (token em sessionStorage); o nome fica salvo no aparelho.

export interface RoomState<V = unknown> {
  status: "idle" | "connecting" | "open" | "closed";
  room: RoomInfo | null;
  view: V | null;
  error: string | null;
  created: string | null;
}

let state: RoomState = { status: "idle", room: null, view: null, error: null, created: null };
const listeners = new Set<() => void>();
let ws: WebSocket | null = null;
let queue: string[] = [];
let retry = 0;
// o hello (com o ticket de quem está logado) vai antes de qualquer outra mensagem
let ready = false;
let ticket: string | null = null;

/** Ticket assinado pelo site: o servidor de jogos sabe quem está logado e salva o resultado no perfil. */
async function fetchTicket(): Promise<string | null> {
  try {
    const r = await fetch("/api/ws-ticket", { cache: "no-store" });
    return r.status === 200 ? ((await r.json()) as { ticket: string }).ticket : null;
  } catch {
    return null;
  }
}

const hello = () => JSON.stringify({ t: "hello", token: getToken(), name: getName() || "Jogador", ticket: ticket ?? undefined });

function set(patch: Partial<RoomState>) {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
}

export function getToken(): string {
  let t = sessionStorage.getItem("truco.token");
  if (!t) {
    t = crypto.randomUUID();
    sessionStorage.setItem("truco.token", t);
  }
  return t;
}

export function getName(): string {
  return localStorage.getItem("truco.name") ?? "";
}

/** Login, logout ou nome/foto trocados no perfil: busca o ticket de novo e avisa o servidor (a sala aberta já atualiza). */
export async function refreshIdentity() {
  if (!ready || ws?.readyState !== WebSocket.OPEN) return;
  ticket = await fetchTicket();
  if (ready && ws?.readyState === WebSocket.OPEN) ws.send(hello());
}

export function setName(name: string) {
  localStorage.setItem("truco.name", name);
  if (ready && ws?.readyState === WebSocket.OPEN) ws.send(hello());
}

declare global {
  interface Window {
    __ENV__?: { WS_URL?: string; ADSENSE_CLIENT?: string; ADSENSE_SLOT?: string };
  }
}

function url() {
  if (window.__ENV__?.WS_URL) return window.__ENV__.WS_URL;
  const proto = location.protocol === "https:" ? "wss" : "ws";
  return `${proto}://${location.hostname}:3001`;
}

export function connect() {
  if (ws && ws.readyState <= WebSocket.OPEN) return;
  set({ status: "connecting" });
  const sock = new WebSocket(url());
  ws = sock;
  sock.onopen = async () => {
    retry = 0;
    ticket = await fetchTicket();
    if (ws !== sock || sock.readyState !== WebSocket.OPEN) return;
    sock.send(hello());
    queue.forEach((m) => sock.send(m));
    queue = [];
    ready = true;
    set({ status: "open" });
  };
  sock.onmessage = (e) => {
    const msg: ServerMsg<unknown> = JSON.parse(e.data);
    if (msg.t === "frame") {
      frameListeners.forEach((l) => l(msg.view));
      set({ view: msg.view });
    } else if (msg.t === "room") {
      // a partida começou agora (conta uma vez por jogador na mesa)
      if (msg.room.started && !(state.room?.code === msg.room.code && state.room.started))
        track("partida-iniciada", { jogo: msg.room.game, modo: msg.room.solo ? "solo" : "online", humanos: msg.room.seats.filter((s) => s.kind === "human").length });
      set({ room: msg.room, view: msg.view, error: null });
    }
    else if (msg.t === "created") set({ created: msg.code });
    else if (msg.t === "left") set({ room: null, view: null });
    else if (msg.t === "error") set({ error: msg.message });
  };
  sock.onclose = (e) => {
    if (ws !== sock) return;
    ws = null;
    ready = false;
    set({ status: "closed" });
    if (e.code === 4000) return;
    setTimeout(connect, Math.min(5000, 500 * 2 ** retry++));
  };
}

const frameListeners = new Set<(view: unknown) => void>();

/** Jogo em tempo real: cada quadro na hora em que chega (para desenhar sem esperar o React). */
export function onFrame<V>(listener: (view: V) => void) {
  const l = listener as (view: unknown) => void;
  frameListeners.add(l);
  return () => {
    frameListeners.delete(l);
  };
}

export function send<A>(msg: ClientMsg<A>) {
  if (msg.t === "create") track("sala-criada", { jogo: msg.game ?? "truco-paulista", modo: msg.solo ? "solo" : "online" });
  const data = JSON.stringify(msg);
  if (ready && ws?.readyState === WebSocket.OPEN) ws.send(data);
  else {
    queue.push(data);
    connect();
  }
}

export function clearError() {
  set({ error: null });
}

export function clearCreated() {
  set({ created: null });
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

const serverState: RoomState = state;

/** Estado da sala; `V` é a visão do jogo desta rota. */
export function useRoom<V>(): RoomState<V> {
  return useSyncExternalStore(subscribe, () => state, () => serverState) as RoomState<V>;
}
