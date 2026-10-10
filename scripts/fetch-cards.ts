// Baixa as 40 cartas do truco de https://github.com/Webisso/playing-cards (MIT)
import { mkdir } from "node:fs/promises";
import { join } from "node:path";

const BASE = "https://raw.githubusercontent.com/Webisso/playing-cards/main/png";
const OUT = join(import.meta.dir, "../apps/web/public/cards");
const RANKS = ["4", "5", "6", "7", "queen", "jack", "king", "ace", "2", "3"];
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
await Promise.all(jobs);
console.log(`${jobs.length} cartas em ${OUT}`);
