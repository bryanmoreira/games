"use client";

import { useSyncExternalStore } from "react";
import type { ClientMsg, PlayerView, RoomInfo, ServerMsg } from "@truco/game";

export interface TrucoState {
  status: "idle" | "connecting" | "open" | "closed";
  room: RoomInfo | null;
  view: PlayerView | null;
  error: string | null;
  created: string | null;
}

let state: TrucoState = { status: "idle", room: null, view: null, error: null, created: null };
const listeners = new Set<() => void>();
let ws: WebSocket | null = null;
let queue: string[] = [];
let retry = 0;

function set(patch: Partial<TrucoState>) {
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

export function setName(name: string) {
  localStorage.setItem("truco.name", name);
  if (ws?.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ t: "hello", token: getToken(), name }));
}

function url() {
  if (process.env.NEXT_PUBLIC_WS_URL) return process.env.NEXT_PUBLIC_WS_URL;
  const proto = location.protocol === "https:" ? "wss" : "ws";
  return `${proto}://${location.hostname}:3001`;
}

export function connect() {
  if (ws && ws.readyState <= WebSocket.OPEN) return;
  set({ status: "connecting" });
  const sock = new WebSocket(url());
  ws = sock;
  sock.onopen = () => {
    retry = 0;
    sock.send(JSON.stringify({ t: "hello", token: getToken(), name: getName() || "Jogador" }));
    queue.forEach((m) => sock.send(m));
    queue = [];
    set({ status: "open" });
  };
  sock.onmessage = (e) => {
    const msg: ServerMsg = JSON.parse(e.data);
    if (msg.t === "room") set({ room: msg.room, view: msg.view, error: null });
    else if (msg.t === "created") set({ created: msg.code });
    else if (msg.t === "left") set({ room: null, view: null });
    else if (msg.t === "error") set({ error: msg.message });
  };
  sock.onclose = (e) => {
    if (ws !== sock) return;
    ws = null;
    set({ status: "closed" });
    if (e.code === 4000) return;
    setTimeout(connect, Math.min(5000, 500 * 2 ** retry++));
  };
}

export function send(msg: ClientMsg) {
  const data = JSON.stringify(msg);
  if (ws?.readyState === WebSocket.OPEN) ws.send(data);
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

const serverState: TrucoState = state;

export function useTruco(): TrucoState {
  return useSyncExternalStore(subscribe, () => state, () => serverState);
}
