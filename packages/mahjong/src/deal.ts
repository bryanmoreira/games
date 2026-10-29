import { freeSlots, getLayout, mulberry32, shuffle, type Layout, type Rng } from "./board";
import { allPairs, groupOf, type Kind } from "./tiles";

// Sorteio com solução garantida: tira pares de casas livres do tabuleiro cheio, um atrás do outro,
// e só depois põe um par de peças iguais em cada par de casas. Jogar os pares na mesma ordem limpa a mesa.

const TRIES = 400;

/** Ordem de tirada das casas que ainda estão na mesa (`gone[i]` falso), de dois em dois; null se travou. */
function removalOrder(l: Layout, gone: readonly boolean[], rng: Rng): [number, number][] | null {
  const g = gone.slice();
  let left = g.filter((x) => !x).length;
  const order: [number, number][] = [];
  while (left > 0) {
    const free = freeSlots(l, g);
    if (free.length < 2) return null;
    // as peças de cima e as que travam mais peças saem antes, para o fim não ficar com pilhas
    const weight = free.map((i) => 1 + l.slots[i].z * 2 + l.over[i].length);
    const a = pick(free, weight, rng);
    const rest = free.filter((i) => i !== a);
    const b = pick(rest, rest.map((i) => 1 + l.slots[i].z * 2 + l.over[i].length), rng);
    g[a] = g[b] = true;
    order.push([a, b]);
    left -= 2;
  }
  return order;
}

function pick(items: number[], weight: number[], rng: Rng): number {
  let r = rng() * weight.reduce((s, w) => s + w, 0);
  for (let k = 0; k < items.length; k++) if ((r -= weight[k]) < 0) return items[k];
  return items[items.length - 1];
}

/**
 * Dá para limpar as casas que sobram com algum arranjo das peças? (Não dá, por exemplo, com duas peças
 * empilhadas uma na outra.) Procura ao acaso, então um "não" pode ser falso com poucas tentativas.
 */
export function clearable(l: Layout, gone: readonly boolean[], rng: Rng, tries = 30): boolean {
  for (let t = 0; t < tries; t++) if (removalOrder(l, gone, rng)) return true;
  return false;
}

export interface Deal {
  /** tipo da peça de cada casa */
  kinds: Kind[];
  /** uma solução: a ordem dos pares que limpa a mesa */
  solution: [number, number][];
}

/** Mesa nova do formato `layoutId`, sempre com solução. O mesmo `seed` dá a mesma mesa. */
export function deal(layoutId: string, seed: number): Deal {
  const l = getLayout(layoutId);
  const rng = mulberry32(seed);
  const gone = l.slots.map(() => false);
  for (let t = 0; t < TRIES; t++) {
    const order = removalOrder(l, gone, rng);
    if (!order) continue;
    const pairs = shuffle(allPairs(), rng);
    const kinds: Kind[] = new Array(l.slots.length);
    order.forEach(([a, b], k) => {
      const [x, y] = rng() < 0.5 ? pairs[k] : [pairs[k][1], pairs[k][0]];
      kinds[a] = x;
      kinds[b] = y;
    });
    return { kinds, solution: order };
  }
  throw new Error(`Não deu para sortear o formato ${layoutId}`);
}

/**
 * Embaralha as peças que ainda estão na mesa entre as mesmas casas, mantendo uma solução quando dá.
 * Devolve os tipos novos de todas as casas (as que já saíram ficam como estavam) e a solução, se tiver.
 */
export function reshuffle(l: Layout, kinds: readonly Kind[], gone: readonly boolean[], seed: number): { kinds: Kind[]; solution: [number, number][] | null } {
  const rng = mulberry32(seed);
  const alive = l.slots.map((_, i) => i).filter((i) => !gone[i]);
  // as peças que sobram sempre formam pares (saem de dois em dois): junta as do mesmo grupo
  const byGroup = new Map<number, Kind[]>();
  for (const i of alive) {
    const g = groupOf(kinds[i]);
    byGroup.set(g, [...(byGroup.get(g) ?? []), kinds[i]]);
  }
  const pairs: [Kind, Kind][] = [];
  for (const ks of byGroup.values()) for (let k = 0; k + 1 < ks.length; k += 2) pairs.push([ks[k], ks[k + 1]]);
  const out = kinds.slice();
  for (let t = 0; t < TRIES; t++) {
    const order = removalOrder(l, gone, rng);
    if (!order) continue;
    shuffle(pairs, rng);
    order.forEach(([a, b], k) => {
      out[a] = pairs[k][0];
      out[b] = pairs[k][1];
    });
    return { kinds: out, solution: order };
  }
  // sem ordem possível (sobrou uma pilha): só mistura
  const ks = shuffle(alive.map((i) => kinds[i]), rng);
  alive.forEach((i, k) => (out[i] = ks[k]));
  return { kinds: out, solution: null };
}
