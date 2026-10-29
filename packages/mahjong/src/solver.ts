import { freeSlots, type Layout } from "./board";
import { groupOf, type Kind } from "./tiles";

// Busca em profundidade por uma sequência de pares que limpa a mesa, com orçamento de nós.
// Grupo com todas as peças que sobram livres sai sem ramificar (não tem como errar);
// os outros lances vão primeiro para as peças que travam mais peças.

const blockCache = new WeakMap<Layout, number[]>();

/** Quantas peças cada casa trava (por cima ou de lado). */
function blocksOf(l: Layout): number[] {
  let b = blockCache.get(l);
  if (!b) {
    b = l.slots.map(() => 0);
    for (let j = 0; j < l.slots.length; j++) for (const i of [...l.over[j], ...l.left[j], ...l.right[j]]) b[i]++;
    blockCache.set(l, b);
  }
  return b;
}

/** Sequência de pares que limpa a mesa a partir de `gone`, ou null (sem solução ou orçamento estourado). */
export function solve(l: Layout, kinds: readonly Kind[], gone0: readonly boolean[], budget = 8_000): [number, number][] | null {
  const gone = gone0.slice();
  const blocks = blocksOf(l);
  const left = new Map<number, number>();
  let alive = 0;
  for (let i = 0; i < kinds.length; i++) {
    if (gone[i]) continue;
    alive++;
    const g = groupOf(kinds[i]);
    left.set(g, (left.get(g) ?? 0) + 1);
  }
  const path: [number, number][] = [];
  const seen = new Set<string>();
  let nodes = 0;

  const take = (a: number, b: number) => {
    gone[a] = gone[b] = true;
    alive -= 2;
    const g = groupOf(kinds[a]);
    left.set(g, left.get(g)! - 2);
    path.push([a, b]);
  };
  const put = () => {
    const [a, b] = path.pop()!;
    gone[a] = gone[b] = false;
    alive += 2;
    const g = groupOf(kinds[a]);
    left.set(g, left.get(g)! + 2);
  };

  const dfs = (): boolean => {
    if (alive === 0) return true;
    if (++nodes > budget) return false;
    const key = gone.map((x) => (x ? 1 : 0)).join("");
    if (seen.has(key)) return false;
    seen.add(key);

    const byGroup = new Map<number, number[]>();
    for (const i of freeSlots(l, gone)) {
      const g = groupOf(kinds[i]);
      byGroup.set(g, [...(byGroup.get(g) ?? []), i]);
    }
    // lance seguro: todas as que sobram do grupo estão livres
    for (const [g, fs] of byGroup) {
      if (fs.length >= 2 && fs.length === left.get(g)) {
        const depth = path.length;
        for (let k = 0; k + 1 < fs.length; k += 2) take(fs[k], fs[k + 1]);
        if (dfs()) return true;
        while (path.length > depth) put();
        return false;
      }
    }
    const options: [number, number][] = [];
    for (const fs of byGroup.values()) for (let x = 0; x < fs.length; x++) for (let y = x + 1; y < fs.length; y++) options.push([fs[x], fs[y]]);
    const score = ([a, b]: [number, number]) => blocks[a] + blocks[b] + l.slots[a].z + l.slots[b].z;
    options.sort((p, q) => score(q) - score(p));
    for (const [a, b] of options) {
      take(a, b);
      if (dfs()) return true;
      put();
      if (nodes > budget) return false;
    }
    return false;
  };

  return dfs() ? path.slice() : null;
}
