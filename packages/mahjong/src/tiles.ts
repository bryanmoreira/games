// As 144 peças: 34 tipos com 4 cópias (caracteres, círculos e bambus de 1 a 9, 4 ventos, 3 dragões)
// mais 4 flores e 4 estações, uma de cada. Qualquer flor forma par com qualquer flor; o mesmo com as estações.

export type Kind = number;

export const SUITS = ["m", "p", "s"] as const;
export const WINDS = ["ton", "nan", "shaa", "pei"] as const;
export const DRAGONS = ["chun", "hatsu", "haku"] as const;
export const FLOWERS = ["flor1", "flor2", "flor3", "flor4"] as const;
export const SEASONS = ["estacao1", "estacao2", "estacao3", "estacao4"] as const;

/** Nome do arquivo de cada tipo, na ordem dos números: 0–8 caracteres, 9–17 círculos, 18–26 bambus, 27–30 ventos, 31–33 dragões, 34–37 flores, 38–41 estações. */
export const KIND_FILES: readonly string[] = [
  ...SUITS.flatMap((s) => [1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => `${s}${n}`)),
  ...WINDS,
  ...DRAGONS,
  ...FLOWERS,
  ...SEASONS,
];

export const KINDS = KIND_FILES.length;
export const FLOWER = 34;
export const SEASON = 38;
export const TILE_COUNT = 144;

/** Grupo de par: o próprio tipo, ou o primeiro das flores/estações. */
export const groupOf = (k: Kind) => (k < FLOWER ? k : k < SEASON ? FLOWER : SEASON);

export const matches = (a: Kind, b: Kind) => groupOf(a) === groupOf(b);

/** Pares do jogo inteiro (72): dois pares de cada tipo comum, e as flores e estações juntas duas a duas. */
export function allPairs(): [Kind, Kind][] {
  const pairs: [Kind, Kind][] = [];
  for (let k = 0; k < FLOWER; k++) pairs.push([k, k], [k, k]);
  pairs.push([34, 35], [36, 37], [38, 39], [40, 41]);
  return pairs;
}

const SUIT_NAME = ["Caractere", "Círculo", "Bambu"];
const WIND_NAME = ["Vento Leste", "Vento Sul", "Vento Oeste", "Vento Norte"];
const DRAGON_NAME = ["Dragão Vermelho", "Dragão Verde", "Dragão Branco"];
const FLOWER_NAME = ["Ameixeira", "Orquídea", "Crisântemo", "Bambu em flor"];
const SEASON_NAME = ["Primavera", "Verão", "Outono", "Inverno"];

export function kindName(k: Kind): string {
  if (k < 27) return `${SUIT_NAME[Math.floor(k / 9)]} ${(k % 9) + 1}`;
  if (k < 31) return WIND_NAME[k - 27];
  if (k < FLOWER) return DRAGON_NAME[k - 31];
  if (k < SEASON) return `Flor: ${FLOWER_NAME[k - FLOWER]}`;
  return `Estação: ${SEASON_NAME[k - SEASON]}`;
}
