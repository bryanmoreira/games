// Baixa as 52 cartas (truco usa 40; spider usa todas) e os 2 coringas (buraco) de https://github.com/Webisso/playing-cards (MIT)
import { mkdir } from "node:fs/promises";
import { join } from "node:path";

const BASE = "https://raw.githubusercontent.com/Webisso/playing-cards/main/png";
const OUT = join(import.meta.dir, "../apps/web/public/cards");
const RANKS = ["ace", "2", "3", "4", "5", "6", "7", "8", "9", "10", "jack", "queen", "king"];
const SUITS = ["clubs", "diamonds", "hearts", "spades"];
const FACES = new Set(["queen", "jack", "king"]);

await mkdir(OUT, { recursive: true });
const jobs = RANKS.flatMap((r) =>
  SUITS.map(async (s) => {
    const name = `${r}_of_${s}`;
    const src = `${BASE}/${name}${FACES.has(r) ? "2" : ""}.png`;
    const res = await fetch(src);
    if (!res.ok) throw new Error(`${src}: ${res.status}`);
    await Bun.write(join(OUT, `${name}.png`), res);
  }),
);
const jokers = ["black_joker", "red_joker"].map(async (name) => {
  const src = `${BASE}/${name}.png`;
  const res = await fetch(src);
  if (!res.ok) throw new Error(`${src}: ${res.status}`);
  await Bun.write(join(OUT, `${name}.png`), res);
});
await Promise.all([...jobs, ...jokers]);
console.log(`${jobs.length + jokers.length} cartas em ${OUT}`);
