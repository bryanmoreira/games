"use client";

import { useSyncExternalStore } from "react";
import type { ChipGrant, ChipsState } from "@/lib/chips";

// Um estado só para o saldo do cabeçalho e a janela do prêmio do dia.
let state: ChipsState | null = null;
let gained: ChipGrant[] = [];
let claimed: string | null = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

/** Ao abrir o site (uma vez por usuário): pega o login do dia e o que faltar pagar. */
export async function claimChips(userId: string) {
  if (claimed === userId) return;
  claimed = userId;
  const r = await fetch("/api/chips", { method: "POST" }).catch(() => null);
  if (!r?.ok) return;
  const j = (await r.json()) as { gained: ChipGrant[]; state: ChipsState };
  state = j.state;
  gained = j.gained;
  emit();
}

/** Saldo de novo (depois de uma conquista, por exemplo). */
export async function refreshChips() {
  const r = await fetch("/api/chips", { cache: "no-store" }).catch(() => null);
  if (!r?.ok) return;
  state = (await r.json()) as ChipsState;
  emit();
}

export function dismissGained() {
  gained = [];
  emit();
}

export function resetChips() {
  state = null;
  gained = [];
  claimed = null;
  emit();
}

export const useChips = () => useSyncExternalStore(subscribe, () => state, () => null);
export const useGained = () => useSyncExternalStore(subscribe, () => gained, () => gained);
