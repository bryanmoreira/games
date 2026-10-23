import { isJoker, isWildCard, points, rankValue, SUITS, type Rng } from "./cards";
import { wildCount } from "./melds";
import { canDiscard, plan, type Ctx } from "./rules";
import type { Action, Card, Meld, PlayerView, Seat, TakeOption } from "./types";

/** Posições que a carta pode ocupar numa sequência (o ás, em duas). */
const positions = (c: Card): number[] => (c.rank === "A" ? [1, 14] : [rankValue(c.rank)]);

const ctxOfView = (v: PlayerView): Ctx => ({
  hand: v.myHand,
  team: v.team!,
  melds: v.melds,
  mortoTaken: v.mortoTaken[v.team!],
  pile: v.pile,
});

const ownMelds = (v: PlayerView) => v.melds.filter((m) => m.team === v.team);

/** O jeito de pegar o lixo que gasta menos da mão e menos curingas. */
function bestTake(v: PlayerView): TakeOption {
  const wilds = (o: TakeOption) => o.cards.filter((id) => v.myHand.some((c) => c.id === id && isWildCard(c))).length;
  return [...v.takeOptions].sort((a, b) => wilds(a) - wilds(b) || (a.meld ? 0 : 1) - (b.meld ? 0 : 1) || a.cards.length - b.cards.length)[0];
}

function wantsPile(v: PlayerView, o: TakeOption, rng: Rng): boolean {
  const size = v.pile.length;
  if (v.stockCount === 0) return true;
  if (size >= 5) return true;
  if (size >= 3 && (o.meld !== null || rng() < 0.5)) return true;
  return size >= 2 && o.meld !== null && rng() < 0.6;
}

/** Sequências de 3 ou mais cartas naturais que a mão forma, maiores primeiro. */
function runs(hand: Card[]): string[][] {
  const out: string[][] = [];
  for (const suit of SUITS) {
    const byPos = new Map<number, Card[]>();
    for (const c of hand) {
      if (c.suit !== suit) continue;
      for (const p of positions(c)) byPos.set(p, [...(byPos.get(p) ?? []), c]);
    }
    let start = 0;
    for (let p = 1; p <= 15; p++) {
      if (byPos.has(p)) {
        if (!start) start = p;
        continue;
      }
      if (start && p - start >= 3) {
        const ids = Array.from({ length: p - start }, (_, i) => byPos.get(start + i)![0].id);
        if (new Set(ids).size === ids.length) out.push(ids);
      }
      start = 0;
    }
  }
  return out.sort((a, b) => b.length - a.length);
}

/** Só a carta aceita num jogo já na mesa sem trazer curinga novo (ou o curinga, ao chamar com `allowWild`). */
function addMove(v: PlayerView, ctx: Ctx, m: Meld, c: Card, allowWild: boolean): Action | null {
  const r = plan(ctx, "add", [c.id], m.id);
  if (!r.ok) return null;
  const grows = wildCount(r.plan.arrangement.cards, m.suit) > wildCount(m.cards, m.suit);
  if (grows && !allowWild) return null;
  return { type: "add", seat: v.seat, meld: m.id, cards: [c.id] };
}

/** Pega o que dá para baixar agora, na ordem em que vale mais a pena. */
function bestMeldMove(v: PlayerView, ctx: Ctx): Action | null {
  const mine = ownMelds(v);
  const naturals = ctx.hand.filter((c) => !isJoker(c));
  const wilds = ctx.hand.filter(isWildCard);

  // 1. fecha canastra: jogo de 6 recebe a carta natural que falta
  for (const m of mine) {
    if (m.cards.length !== 6) continue;
    for (const c of naturals) {
      const a = addMove(v, ctx, m, c, false);
      if (a) return a;
    }
  }
  // 2. jogo novo com as sequências da mão
  for (const ids of runs(ctx.hand)) {
    for (const cut of [ids, ids.slice(0, -1), ids.slice(1)]) {
      if (cut.length >= 3 && plan(ctx, "meld", cut, null).ok) return { type: "meld", seat: v.seat, cards: cut };
    }
  }
  // 3. acrescenta cartas naturais nos jogos
  for (const m of mine) {
    for (const c of naturals) {
      const a = addMove(v, ctx, m, c, false);
      if (a) return a;
    }
  }
  // 4. curinga fecha a canastra suja (jogo limpo de 6 cartas)
  for (const m of mine) {
    if (m.cards.length !== 6 || wildCount(m.cards, m.suit) > 0) continue;
    for (const w of wilds) {
      const a = addMove(v, ctx, m, w, true);
      if (a) return a;
    }
  }
  // 5. fim de monte ou mão curta: livra-se dos curingas e das cartas soltas
  if (v.stockCount < 12 || ctx.hand.length <= 5) {
    for (const m of mine) {
      if (wildCount(m.cards, m.suit) > 0) continue;
      for (const w of wilds) {
        const a = addMove(v, ctx, m, w, true);
        if (a) return a;
      }
    }
    for (const w of wilds) {
      for (let i = 0; i < naturals.length; i++) {
        for (let j = i + 1; j < naturals.length; j++) {
          const ids = [naturals[i].id, naturals[j].id, w.id];
          if (isWildCard(naturals[i]) || isWildCard(naturals[j])) continue;
          if (plan(ctx, "meld", ids, null).ok) return { type: "meld", seat: v.seat, cards: ids };
        }
      }
    }
  }
  return null;
}

/** Quanto vale guardar a carta na mão (menor = melhor descartar). */
function keepValue(c: Card, v: PlayerView, hand: Card[]): number {
  if (isWildCard(c)) return isJoker(c) ? 120 : 100;
  let val = 0;
  for (const o of hand) {
    if (o.id === c.id || o.suit !== c.suit || isWildCard(o)) continue;
    let d = 99;
    for (const a of positions(c)) for (const b of positions(o)) d = Math.min(d, Math.abs(a - b));
    if (d === 0) val += 1;
    else if (d === 1) val += 4;
    else if (d === 2) val += 3;
  }
  for (const m of v.melds) {
    if (m.suit !== c.suit) continue;
    const lo = m.cards[0].as;
    const hi = m.cards[m.cards.length - 1].as;
    const near = positions(c).some((p) => p === lo - 1 || p === hi + 1);
    if (!near) continue;
    // carta que serve num jogo nosso fica na mão; que serve no do adversário não se dá de bandeja
    val += m.team === v.team ? 6 : 5;
  }
  return val - points(c) / 100;
}

function chooseDiscard(v: PlayerView, ctx: Ctx): string | null {
  const legal = ctx.hand.filter((c) => canDiscard(ctx, c.id));
  if (legal.length === 0) return null;
  let best = legal[0];
  let bestVal = Infinity;
  for (const c of legal) {
    const val = keepValue(c, v, ctx.hand);
    if (val < bestVal) {
      best = c;
      bestVal = val;
    }
  }
  return best.id;
}

/** Jogada do bot a partir da visão dele (sem ver as cartas dos outros). */
export function decide(v: PlayerView, rng: Rng = Math.random): Action | null {
  if (v.phase !== "playing" || v.turn !== v.seat || v.team === null) return null;
  const seat: Seat = v.seat;
  const ctx = ctxOfView(v);

  if (v.step === "draw") {
    if (v.canTake) {
      const o = bestTake(v);
      if (wantsPile(v, o, rng)) return { type: "take", seat, cards: o.cards, meld: o.meld };
    }
    if (v.canDraw) return { type: "draw", seat };
    if (v.canTake) {
      const o = bestTake(v);
      return { type: "take", seat, cards: o.cards, meld: o.meld };
    }
    return null;
  }

  const move = bestMeldMove(v, ctx);
  if (move) return move;
  const card = chooseDiscard(v, ctx);
  return card ? { type: "discard", seat, card } : null;
}

