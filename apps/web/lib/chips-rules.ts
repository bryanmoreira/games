/** Regras das fichas sem banco (testadas em test/chips.test.ts). O banco fica em lib/chips.ts. */
import { nextDay } from "@/lib/stats/achievements";
import type { AchievementDef, AchievementTier } from "@/lib/stats/achievements";

export type ChipReason = "welcome" | "achievement" | "login" | "purchase" | "admin" | "referral" | "referred";

/** Presente da conta nova (quem já jogava antes das fichas também ganha). */
export const WELCOME_CHIPS = 100;

export const TIER_CHIPS: Record<AchievementTier, number> = { easy: 25, medium: 75, hard: 200 };

/** Fichas e quantas fichinhas o card mostra (1 a 3). */
export const achievementTier = (a: Pick<AchievementDef, "tier">): AchievementTier => a.tier ?? "medium";
export const achievementChips = (a: Pick<AchievementDef, "tier">) => TIER_CHIPS[achievementTier(a)];
export const TIER_LEVEL: Record<AchievementTier, number> = { easy: 1, medium: 2, hard: 3 };

/** Login diário: dia 1 a 7 da sequência; depois do 7 volta ao 1. */
export const LOGIN_CHIPS = [10, 15, 20, 25, 30, 40, 75] as const;

/**
 * Dia da sequência ao entrar hoje (1 a 7), ou null se já pegou hoje.
 * Entrou ontem: continua (depois do 7, recomeça); faltou um dia ou nunca entrou: dia 1.
 */
export function loginDay(lastDay: string | null, streak: number, today: string): number | null {
  if (lastDay === today) return null;
  if (lastDay && nextDay(lastDay) === today && streak >= 1 && streak < LOGIN_CHIPS.length) return streak + 1;
  return 1;
}

/** Dia da sequência que vale agora (para mostrar os 7 dias): 0 = sequência perdida ou nunca entrou. */
export function currentLoginStreak(lastDay: string | null, streak: number, today: string): number {
  if (!lastDay) return 0;
  return lastDay === today || nextDay(lastDay) === today ? streak : 0;
}

// Indicação: quem chega por um link compartilhado (?ref=<usuario>) e cria conta paga as duas pontas, uma vez só.
/** Para quem indicou, por amigo que criou conta */
export const REFERRAL_CHIPS = 150;
/** Bônus de quem chegou indicado */
export const REFERRED_CHIPS = 50;
/** Indicações pagas por mês para a mesma pessoa */
export const REFERRAL_MAX_PER_MONTH = 20;
/** Só conta nova: criada há no máximo isto */
export const REFERRAL_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

/** Por que a indicação não vale (null = vale). Sem banco: testado em test/chips.test.ts. */
export function referralProblem(r: {
  referrerId: string | null;
  referredId: string;
  referredCreatedAt: Date;
  now: Date;
  alreadyReferred: boolean;
  referrerThisMonth: number;
}): string | null {
  if (!r.referrerId) return "quem indicou não existe";
  if (r.referrerId === r.referredId) return "não dá para indicar a si mesmo";
  if (r.alreadyReferred) return "esta conta já foi indicada";
  if (r.now.getTime() - r.referredCreatedAt.getTime() > REFERRAL_WINDOW_MS) return "só vale para conta nova";
  if (r.referrerThisMonth >= REFERRAL_MAX_PER_MONTH) return "limite de indicações do mês";
  return null;
}
