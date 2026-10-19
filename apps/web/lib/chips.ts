import { prisma } from "@/lib/db";
import { achievementChips, currentLoginStreak, LOGIN_CHIPS, loginDay, WELCOME_CHIPS, type ChipReason } from "@/lib/chips-rules";
import { ACHIEVEMENT_BY_CODE, dayKey, type AchievementDef } from "@/lib/stats/achievements";

export interface ChipGrant {
  reason: ChipReason;
  ref: string;
  delta: number;
}

/** Linha do histórico (página Fichas do perfil). */
export interface ChipEntry extends ChipGrant {
  id: string;
  at: Date;
}

export interface ChipsState {
  chips: number;
  /** dia da sequência de login que vale agora (0 a 7) */
  streak: number;
  /** fichas de cada dia da sequência */
  rewards: readonly number[];
}

/**
 * Dá as fichas numa transação: a linha é única por motivo + referência, então o que já foi pago é ignorado.
 * `login`: se a linha do login entrou agora, guarda a sequência no jogador. Devolve só o que entrou agora.
 */
async function grant(userId: string, grants: ChipGrant[], login?: { day: number; today: string }): Promise<ChipGrant[]> {
  if (!grants.length) return [];
  return prisma.$transaction(async (tx) => {
    const created = await tx.chipTransaction.createManyAndReturn({
      data: grants.map((g) => ({ userId, ...g })),
      skipDuplicates: true,
      select: { reason: true, ref: true, delta: true },
    });
    const sum = created.reduce((s, g) => s + g.delta, 0);
    const loggedIn = login && created.some((g) => g.reason === "login");
    if (sum || loggedIn)
      await tx.user.update({
        where: { id: userId },
        data: { chips: { increment: sum }, ...(loggedIn ? { loginStreak: login.day, lastLoginDay: login.today } : {}) },
      });
    return created as ChipGrant[];
  });
}

/** Conquistas que acabaram de sair viram fichas. */
export function grantAchievements(userId: string, defs: AchievementDef[]) {
  return grant(
    userId,
    defs.map((a) => ({ reason: "achievement", ref: a.code, delta: achievementChips(a) })),
  );
}

/**
 * Ao abrir o site: boas-vindas, conquistas que ainda não pagaram (as de antes das fichas) e o login do dia.
 * Pode chamar quantas vezes quiser; só paga o que falta.
 */
export async function claimChips(userId: string): Promise<ChipGrant[]> {
  const today = dayKey(new Date());
  const [user, paid, unlocked] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { loginStreak: true, lastLoginDay: true } }),
    prisma.chipTransaction.findMany({ where: { userId, reason: { in: ["welcome", "achievement"] } }, select: { reason: true, ref: true } }),
    prisma.achievement.findMany({ where: { userId }, orderBy: { unlockedAt: "asc" }, select: { code: true } }),
  ]);
  if (!user) return [];

  const has = new Set(paid.map((p) => `${p.reason}:${p.ref}`));
  const grants: ChipGrant[] = [];
  if (!has.has("welcome:welcome")) grants.push({ reason: "welcome", ref: "welcome", delta: WELCOME_CHIPS });
  for (const { code } of unlocked) {
    const def = ACHIEVEMENT_BY_CODE.get(code);
    if (def && !has.has(`achievement:${code}`)) grants.push({ reason: "achievement", ref: code, delta: achievementChips(def) });
  }
  const day = loginDay(user.lastLoginDay, user.loginStreak, today);
  if (day) grants.push({ reason: "login", ref: today, delta: LOGIN_CHIPS[day - 1] });

  return grant(userId, grants, day ? { day, today } : undefined);
}

/** Dia da sequência que um login pagou (pelo valor: cada dia vale diferente). */
export const loginDayOf = (delta: number) => LOGIN_CHIPS.indexOf(delta as (typeof LOGIN_CHIPS)[number]) + 1 || 1;

/** Saldo e sequência de login (o cabeçalho e a janela do prêmio). */
export async function chipsState(userId: string): Promise<ChipsState | null> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { chips: true, loginStreak: true, lastLoginDay: true } });
  if (!user) return null;
  return { chips: user.chips, streak: currentLoginStreak(user.lastLoginDay, user.loginStreak, dayKey(new Date())), rewards: LOGIN_CHIPS };
}

/** Fichas ganhas e gastas, da mais nova para a mais velha. */
export async function chipHistory(userId: string, take = 200): Promise<ChipEntry[]> {
  const rows = await prisma.chipTransaction.findMany({ where: { userId }, orderBy: [{ createdAt: "desc" }, { id: "desc" }], take });
  return rows.map((r) => ({ id: r.id, reason: r.reason as ChipReason, ref: r.ref, delta: r.delta, at: r.createdAt }));
}
