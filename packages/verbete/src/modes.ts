// Constantes sem a lista de palavras: dá para importar sem carregar as 9 mil palavras.

export const LENGTH = 5;
export type Mode = 1 | 2 | 4;
export const MODES: readonly Mode[] = [1, 2, 4];
/** Verbete (1 palavra) tem 6 tentativas, Dueto (2) tem 7, Quarteto (4) tem 9. */
export const MAX_GUESSES: Record<Mode, number> = { 1: 6, 2: 7, 4: 9 };
export const isMode = (m: unknown): m is Mode => m === 1 || m === 2 || m === 4;

/** right = verde, place = amarelo, absent = cinza */
export type Mark = "right" | "place" | "absent";

/** Sem acento, sem cedilha e em minúsculas: é assim que as palavras se comparam. */
export const plain = (w: string) => w.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
