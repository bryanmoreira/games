import { SAFE, trackIndex } from "./board";
import { BASE, COLORS, HOME, PIECES, type Action, type Capture, type Color, type GameState, type Seat } from "./types";

export type Result = { ok: true; state: GameState } | { ok: false; error: string };

export const MIN_PLAYERS = 2;
export const MAX_PLAYERS = 4;

/** Números que tiram a peça da base. */
export const EXIT_ROLLS = [1, 6];

/** Cor de cada lugar: com 3 ou 4 a do lugar; com 2, o segundo fica com a cor oposta à do primeiro. */
export function seatColors(players: Seat[]): (Color | null)[] {
  const out: (Color | null)[] = Array(COLORS).fill(null);
  for (const p of players) out[p] = p;
  if (players.length === 2) out[players[1]] = (players[0] + 2) % COLORS;
  return out;
}

/** Partida nova com os lugares ocupados. Com `prev` (o "De novo"), mantém o placar e quem começa passa ao próximo. */
export function newGame(rng: () => number = Math.random, players: Seat[], prev?: GameState | null): GameState {
  const ps = [...new Set(players)].filter((p) => Number.isInteger(p) && p >= 0 && p < COLORS).sort((a, b) => a - b);
  if (ps.length < MIN_PLAYERS) throw new Error("Ludo precisa de 2 a 4 jogadores");
  const colorOf = seatColors(ps);
  // rodada no sentido horário das cores
  const byColor = [...ps].sort((a, b) => colorOf[a]! - colorOf[b]!);
  const starter = prev ? (byColor[(byColor.indexOf(prev.starter) + 1) % byColor.length] ?? byColor[0]) : byColor[Math.floor(rng() * byColor.length)];
  const i = byColor.indexOf(starter);
  const order = [...byColor.slice(i), ...byColor.slice(0, i)];
  const stats = Array.from({ length: COLORS }, () => ({ captures: 0, lost: 0, turns: 0, trailed: false }));
  stats[starter].turns = 1;
  return {
    players: ps,
    colorOf,
    order,
    turn: 0,
    starter,
    pieces: Array.from({ length: COLORS }, () => Array(PIECES).fill(BASE)),
    phase: "roll",
    die: null,
    sixes: 0,
    rolls: 0,
    passReason: null,
    moves: [],
    winner: null,
    stats,
    scores: prev ? [...prev.scores] : Array(COLORS).fill(0),
    gameNo: (prev?.gameNo ?? 0) + 1,
  };
}

/** Cópia para o reducer: o histórico de lances é copiado raso (os registros não mudam). */
export const cloneState = (s: GameState): GameState => ({
  ...s,
  players: [...s.players],
  colorOf: [...s.colorOf],
  order: [...s.order],
  pieces: s.pieces.map((p) => [...p]),
  moves: [...s.moves],
  stats: s.stats.map((x) => ({ ...x })),
  scores: [...s.scores],
});

/** Lugar da vez (null com a partida encerrada). */
export const currentSeat = (s: GameState): Seat | null => (s.phase === "gameOver" ? null : s.order[s.turn]);

/** Para onde a peça vai com `die`, ou null se não pode mover. */
export function target(progress: number, die: number): number | null {
  if (progress === BASE) return EXIT_ROLLS.includes(die) ? 0 : null;
  if (progress >= HOME) return null;
  const to = progress + die;
  return to <= HOME ? to : null;
}

/** Peças de `color` que podem mover com `die`. */
export function movablePieces(s: Pick<GameState, "pieces">, color: Color, die: number): number[] {
  return s.pieces[color].flatMap((p, i) => (target(p, die) !== null ? [i] : []));
}

/** Peças de outras cores que seriam capturadas por uma peça de `color` chegando a `progress`. */
export function capturesAt(s: Pick<GameState, "pieces" | "colorOf">, color: Color, progress: number): Capture[] {
  const t = trackIndex(color, progress);
  if (t === null || SAFE.has(t)) return [];
  const out: Capture[] = [];
  for (let c = 0; c < COLORS; c++) {
    if (c === color) continue;
    s.pieces[c].forEach((p, piece) => {
      if (trackIndex(c, p) === t) out.push({ color: c, piece, from: p });
    });
  }
  return out;
}

export const homeCount = (s: Pick<GameState, "pieces">, color: Color) => s.pieces[color].filter((p) => p === HOME).length;

/** Cor em jogo de cada lugar. */
const colorsInPlay = (s: GameState) => s.players.map((p) => s.colorOf[p]!);

/** Passa a vez ao próximo da rodada. */
function nextTurn(s: GameState) {
  s.turn = (s.turn + 1) % s.order.length;
  s.sixes = 0;
  s.phase = "roll";
  s.passReason = null;
  s.stats[s.order[s.turn]].turns++;
}

/** Marca quem está com 0 peças na chegada enquanto um adversário já tem 3. */
function markTrailing(s: GameState) {
  const top = Math.max(...colorsInPlay(s).map((c) => homeCount(s, c)));
  if (top < 3) return;
  for (const p of s.players) {
    const c = s.colorOf[p]!;
    if (homeCount(s, c) === 0) s.stats[p].trailed = true;
  }
}

export function applyAction(state: GameState, action: Action, rng: () => number = Math.random): Result {
  if (state.phase === "gameOver") return { ok: false, error: "Partida encerrada" };
  const seat = state.order[state.turn];
  const color = state.colorOf[seat]!;

  if (action?.type === "advance") {
    if (state.phase !== "pass") return { ok: false, error: "Nada a avançar" };
    const s = cloneState(state);
    // sem lance com 6: rola de novo (o 3º seis já passou a vez)
    if (s.passReason === "noMoves" && s.die === 6) {
      s.phase = "roll";
      s.passReason = null;
    } else nextTurn(s);
    return { ok: true, state: s };
  }

  if (action?.seat !== seat) return { ok: false, error: "Não é sua vez" };

  if (action.type === "roll") {
    if (state.phase !== "roll") return { ok: false, error: "Agora é para mover" };
    const s = cloneState(state);
    const die = 1 + Math.min(5, Math.floor(rng() * 6));
    s.die = die;
    s.rolls++;
    s.sixes = die === 6 ? s.sixes + 1 : 0;
    if (s.sixes >= 3) {
      s.phase = "pass";
      s.passReason = "threeSixes";
    } else if (movablePieces(s, color, die).length === 0) {
      s.phase = "pass";
      s.passReason = "noMoves";
    } else s.phase = "move";
    return { ok: true, state: s };
  }

  if (action.type === "move") {
    if (state.phase !== "move" || state.die === null) return { ok: false, error: "Role o dado" };
    const piece = action.piece;
    if (!Number.isInteger(piece) || piece < 0 || piece >= PIECES) return { ok: false, error: "Peça inválida" };
    const from = state.pieces[color][piece];
    const to = target(from, state.die);
    if (to === null) return { ok: false, error: "Essa peça não anda" };

    const s = cloneState(state);
    const captured = capturesAt(s, color, to);
    s.pieces[color][piece] = to;
    for (const c of captured) {
      s.pieces[c.color][c.piece] = BASE;
      const owner = s.players.find((p) => s.colorOf[p] === c.color);
      if (owner !== undefined) s.stats[owner].lost++;
    }
    s.stats[seat].captures += captured.length;
    s.moves.push({ seat, color, piece, from, to, die: s.die!, captured });
    markTrailing(s);

    if (homeCount(s, color) === PIECES) {
      s.phase = "gameOver";
      s.winner = seat;
      s.scores[seat]++;
      return { ok: true, state: s };
    }
    // joga de novo com 6, captura ou chegada; só o 6 conta para os três seguidos
    if (s.die === 6 || captured.length > 0 || to === HOME) {
      if (s.die !== 6) s.sixes = 0;
      s.phase = "roll";
    } else nextTurn(s);
    return { ok: true, state: s };
  }

  return { ok: false, error: "Ação inválida" };
}

/** Colocação de cada lugar no fim: peças na chegada e, no empate, o caminho andado (1 = primeiro). */
export function placementOf(s: GameState, seat: Seat): number {
  if (s.winner === seat) return 1;
  const key = (p: Seat) => {
    const ps = s.pieces[s.colorOf[p]!];
    return homeCount(s, s.colorOf[p]!) * 1000 + ps.reduce((n, x) => n + Math.max(0, x + 1), 0);
  };
  const mine = key(seat);
  return 1 + s.players.filter((p) => p !== seat && (p === s.winner || key(p) > mine)).length;
}
