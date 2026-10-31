import { expect, test } from "bun:test";
import { parseSoloResult } from "@/lib/stats/solo-result";
import { gameStats } from "@/lib/stats/compute";
import { gameFromPath, STAT_GAMES, isOnlineGame, isSoloGame } from "@/lib/stats/games";

const deck = Array.from({ length: 30 }, (_, i) => Math.floor(i / 2));
const history = Array.from({ length: 30 }, (_, i) => i);
const valid = { deck, history, timeMs: 60_000 };

test("solo da memória refaz o jogo e ignora placar enviado", () => {
  expect(parseSoloResult("jogo-da-memoria", { ...valid, attempts: 9999 })).toEqual({ game: "jogo-da-memoria", data: { timeMs: 60_000, pairs: 15, attempts: 15, mistakes: 0, bestStreak: 15, players: 1 } });
  const withError = parseSoloResult("jogo-da-memoria", { ...valid, history: [0, 2, ...history] });
  expect(withError?.data).toMatchObject({ attempts: 16, mistakes: 1, bestStreak: 15 });
});
test("recusa partida incompleta, baralho inválido, repetição e tempos inválidos", () => {
  for (const change of [{ history: history.slice(0,28) }, { history: [0,0,...history] }, { deck: Array(30).fill(0) }, { history: [...history,0] }, { timeMs: -1 }, { timeMs: NaN }, { timeMs: 86_400_001 }]) expect(parseSoloResult("jogo-da-memoria", { ...valid, ...change })).toBeNull();
});
test("recordes solo não misturam disputas, e modalidades têm contagens separadas", () => {
  const row = (mode: string, timeMs: number, attempts: number) => ({ mode, outcome: "win", placement: null, data: { timeMs, attempts }, createdAt: new Date(0) });
  const stats = gameStats("jogo-da-memoria", [row("solo",120_000,24), row("solo",90_000,26), row("ai",1000,1), row("online",1000,1)]);
  expect(stats.chips).toEqual([{ label:"Melhor tempo solo", value:"1:30" }, { label:"Menos tentativas solo", value:"24" }]);
  expect(stats.modes.ai?.games).toBe(1);
  expect(stats.modes.online?.games).toBe(1);
  expect(STAT_GAMES.filter(g => g === "jogo-da-memoria")).toHaveLength(1);
  expect(isOnlineGame("jogo-da-memoria")).toBe(true);
  expect(isSoloGame("jogo-da-memoria")).toBe(true);
  expect(gameFromPath("/jogo-da-memoria/jogo")).toBe("jogo-da-memoria");
});
