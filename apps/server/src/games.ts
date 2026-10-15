import * as truco from "@truco/game";
import * as c4 from "@truco/connect4";
import * as stop from "@truco/stop";
import * as bn from "@truco/batalha-naval";
import * as cn from "@truco/codenames";
import * as otrio from "@truco/otrio";
import * as velha from "@truco/jogo-da-velha";
import * as damas from "@truco/damas";
import * as ludo from "@truco/ludo";
import * as xadrez from "@truco/xadrez";
import type { GameId, PlayerReport } from "@truco/game";

type Result<S> = { ok: true; state: S } | { ok: false; error: string };

/** O que o servidor de salas precisa saber de cada jogo. */
/** Quem joga a partida nova (lugares ocupados) e as opções do lobby. */
export interface GameSetup {
  seats: number[];
  settings: unknown;
}

export interface GameAdapter<S = any, A = any, V = any> {
  seats: number;
  /** Mínimo de lugares ocupados para começar; sem ele, a mesa precisa estar cheia. */
  minSeats?: number;
  /** Além do mínimo, os lugares ocupados formam uma mesa válida (ex.: mestre e agente em cada time). */
  canStart?(seats: number[]): boolean;
  /** Quem pode agir age sem esperar os outros (ex.: posicionar a frota): o bot não espera o humano. */
  simultaneous?: boolean;
  /** false: sem IA no lobby e ninguém joga no lugar de quem cai. */
  bots?: boolean;
  /** Opções do lobby: padrão e validação do que o host mandou. */
  settings?: { initial: unknown; parse(raw: unknown, prev: unknown): unknown };
  /** Partida nova; `prev` é a partida anterior no "De novo". */
  newGame(prev: S | null, setup: GameSetup): S;
  applyAction(s: S, a: A): Result<S>;
  viewFor(s: S, seat: number): V;
  /** Visão de quem está na sala sem lugar na partida (assistindo); sem ela, o espectador não vê a mesa. */
  spectate?(s: S): V;
  /** Lance do bot a partir da visão dele. */
  decide(v: V): A | null;
  /** Ação vinda do cliente (sem assento) com o assento de quem mandou. */
  withSeat(a: unknown, seat: number): A;
  /** Quem pode agir agora. */
  actors(s: S): number[];
  /** ms até um "advance" automático, ou null. */
  pause(s: S): number | null;
  over(s: S): boolean;
  /** ms que o bot "pensa" antes de agir (sem ele, entre 650 e 1300). */
  botDelay?(s: S): number;
  /** Tempo da animação no cliente depois desta transição (bots esperam). */
  animMs(prev: S | null, next: S): number;
  /** ms até acabar o tempo de quem está na vez (relógio de xadrez), ou null; aí o servidor manda "advance". */
  clock?(s: S): number | null;
  /** Identifica a fase com relógio: enquanto for a mesma, o relógio não reinicia a cada ação. */
  phaseKey?(s: S): string;
  /** Ação que avisa o jogo de quem está desconectado (null se nada mudou). */
  away?(s: S, seats: number[]): A | null;
  /** Resultado de um lugar na partida terminada (o que vai para o perfil). */
  outcome(s: S, seat: number): Omit<PlayerReport, "userId">;
}

// Tempo da animação de embaralhar/distribuir no cliente
const DEAL_MS = 2600;
// Tempo da peça caindo no tabuleiro
const DROP_MS = 700;
// Mira descendo + impacto do tiro
const SHOT_MS = 900;
// Anel encaixando no tabuleiro
const RING_MS = 450;
// Traço do X ou do O sendo riscado
const MARK_MS = 400;
// Cada trecho do caminho da peça de damas (deslizar + pulo)
const DAMAS_STEP_MS = 320;
// Dado rolando no Ludo, cada casa andada e a peça capturada voltando à base
const LUDO_DIE_MS = 750;
const LUDO_STEP_MS = 150;
const LUDO_CAPTURE_MS = 450;
// Peça deslizando no xadrez
const XADREZ_MOVE_MS = 300;
// Dado parado na tela antes de a vez passar (sem lance ou 3º seis)
const LUDO_PASS_MS = 1300;

const trucoAdapter: GameAdapter<truco.GameState, truco.Action, truco.PlayerView> = {
  seats: 4,
  newGame: () => truco.newGame(Math.random, Math.floor(Math.random() * 4) as truco.Seat),
  applyAction: truco.applyAction,
  viewFor: (s, seat) => truco.viewFor(s, seat as truco.Seat),
  decide: (v) => truco.decide(v),
  withSeat: (a, seat) => truco.withSeat(a as truco.ClientAction, seat as truco.Seat),
  actors: (s) =>
    [0, 1, 2, 3].filter((seat) => {
      const v = truco.viewFor(s, seat as truco.Seat);
      return v.canPlay || v.mustRespond || v.mustDecideMao11;
    }),
  pause: (s) => (s.phase === "roundEnd" ? 1400 : s.phase === "handEnd" ? 2600 : null),
  over: (s) => s.phase === "gameOver",
  animMs: (prev, next) => (!prev || prev.handNo !== next.handNo ? DEAL_MS : 0),
  outcome: (s, seat) => {
    const team = truco.teamOf(seat as truco.Seat);
    return {
      outcome: s.winner === team ? "win" : "loss",
      data: { scores: [s.scores[team], s.scores[1 - team]], hands: s.handNo },
    };
  },
};

const connect4Adapter: GameAdapter<c4.GameState, c4.Action, c4.PlayerView> = {
  seats: 2,
  newGame: (prev) => c4.newGame(Math.random, prev),
  applyAction: c4.applyAction,
  viewFor: (s, seat) => c4.viewFor(s, seat as c4.Seat),
  decide: (v) => c4.decide(v),
  withSeat: (a, seat) => ({ type: "drop", col: Number((a as { col?: unknown })?.col), seat: seat as c4.Seat }),
  actors: (s) => (s.phase === "playing" ? [s.turn] : []),
  pause: () => null,
  over: (s) => s.phase === "gameOver",
  animMs: (prev, next) => (prev && next.moves.length > prev.moves.length ? DROP_MS : 0),
  outcome: (s, seat) => ({
    outcome: s.winner === null ? "draw" : s.winner === seat ? "win" : "loss",
    data: { pieces: s.moves.filter((m) => m.seat === seat).length, moves: s.moves.length },
  }),
};

const stopAdapter: GameAdapter<stop.GameState, stop.Action, stop.PlayerView> = {
  seats: stop.MAX_PLAYERS,
  minSeats: stop.MIN_PLAYERS,
  bots: false,
  settings: {
    initial: stop.DEFAULT_SETTINGS,
    parse: (raw, prev) => stop.parseSettings(raw, prev as stop.Settings),
  },
  newGame: (prev, { seats, settings }) =>
    stop.newGame(Math.random, { players: seats, settings: stop.parseSettings(settings) }, prev),
  applyAction: (s, a) => stop.applyAction(s, a),
  viewFor: (s, seat) => stop.viewFor(s, seat),
  decide: () => null,
  withSeat: (a, seat) => ({ ...(a as stop.ClientAction), seat }) as stop.Action,
  actors: (s) => (s.phase === "gameOver" ? [] : s.players),
  pause: (s) => {
    switch (s.phase) {
      case "letter":
        return stop.LETTER_MS;
      case "writing":
        return s.settings.time > 0 ? s.settings.time * 1000 : null;
      case "review":
        return stop.REVIEW_MS;
      case "roundEnd":
        return stop.ROUND_END_MS;
      default:
        return null;
    }
  },
  over: (s) => s.phase === "gameOver",
  animMs: () => 0,
  phaseKey: (s) => `${s.gameNo}:${s.phaseNo}`,
  away: (s, seats) => {
    const away = s.players.filter((p) => seats.includes(p));
    return away.length === s.away.length && away.every((p) => s.away.includes(p)) ? null : { type: "away", seats: away };
  },
  outcome: (s, seat) => {
    const score = s.scores[seat] ?? 0;
    const all = s.players.map((p) => s.scores[p] ?? 0);
    const top = Math.max(...all);
    const atTop = all.filter((x) => x === top).length;
    const mine = s.history.map((r) => r.points[seat] ?? []);
    return {
      // vitória só para o primeiro lugar sozinho; empate no topo é empate
      outcome: score === top ? (atTop > 1 ? "draw" : "win") : "loss",
      placement: 1 + all.filter((x) => x > score).length,
      data: {
        score,
        players: s.players.length,
        unique: mine.flat().filter((p) => p === 10).length,
        stops: s.history.filter((r) => r.stoppedBy === seat).length,
        perfectRounds: mine.filter((pts) => pts.length > 0 && pts.every((p) => p === 10)).length,
      },
    };
  },
};

const batalhaNavalAdapter: GameAdapter<bn.GameState, bn.Action, bn.PlayerView> = {
  seats: 2,
  simultaneous: true,
  newGame: (prev) => bn.newGame(Math.random, prev),
  applyAction: bn.applyAction,
  viewFor: (s, seat) => bn.viewFor(s, seat as bn.Seat),
  decide: (v) => bn.decide(v),
  withSeat: (a, seat) => {
    const m = (a ?? {}) as Record<string, unknown>;
    return m.type === "place"
      ? { type: "place", seat: seat as bn.Seat, ships: m.ships as bn.Ship[] }
      : { type: "shoot", seat: seat as bn.Seat, col: Number(m.col), row: Number(m.row) };
  },
  actors: (s) => (s.phase === "placing" ? ([0, 1] as const).filter((p) => !s.fleets[p]) : s.phase === "battle" ? [s.turn] : []),
  pause: () => null,
  over: (s) => s.phase === "gameOver",
  animMs: (prev, next) => (prev && next.shots.length > prev.shots.length ? SHOT_MS : 0),
  outcome: (s, seat) => {
    const mine = s.shots.filter((x) => x.seat === seat);
    return {
      outcome: s.winner === seat ? "win" : "loss",
      data: {
        shots: mine.length,
        hits: mine.filter((x) => x.hit).length,
        shipsLost: s.shots.filter((x) => x.seat !== seat && x.sunk !== null).length,
      },
    };
  },
};

const codenamesAdapter: GameAdapter<cn.GameState, cn.Action, cn.PlayerView> = {
  seats: cn.SEATS,
  minSeats: 4,
  canStart: cn.canStart,
  bots: false,
  settings: {
    initial: cn.DEFAULT_SETTINGS,
    parse: (raw, prev) => cn.parseSettings(raw, prev as cn.Settings),
  },
  newGame: (prev, { seats, settings }) => cn.newGame(Math.random, { players: seats, settings: cn.parseSettings(settings) }, prev),
  applyAction: cn.applyAction,
  viewFor: (s, seat) => cn.viewFor(s, seat),
  spectate: (s) => cn.viewFor(s, null),
  decide: () => null,
  withSeat: (a, seat) => ({ ...(a as cn.ClientAction), seat }) as cn.Action,
  actors: (s) =>
    s.players.filter((p) => (s.phase === "clue" ? cn.canClue(s, p) : s.phase === "guess" ? cn.canGuess(s, p) : false)),
  pause: (s) => (s.phase !== "gameOver" && s.settings.time > 0 ? s.settings.time * 1000 : null),
  over: (s) => s.phase === "gameOver",
  animMs: () => 0,
  phaseKey: (s) => `${s.gameNo}:${s.phaseNo}`,
  outcome: (s, seat) => {
    const team = cn.teamOf(seat);
    // dica que mais rendeu: palavras do próprio time achadas com ela
    const bestClue = Math.max(0, ...s.clues.filter((c) => c.seat === seat).map((c) => c.guesses.filter((g) => s.cards[g]?.key === team).length));
    return {
      outcome: s.winner === team ? "win" : "loss",
      data: { role: cn.roleOf(seat), assassin: s.reason === "assassin" && s.winner !== team, bestClue },
    };
  },
};

const otrioAdapter: GameAdapter<otrio.GameState, otrio.Action, otrio.PlayerView> = {
  seats: otrio.MAX_PLAYERS,
  minSeats: otrio.MIN_PLAYERS,
  newGame: (prev, { seats }) => otrio.newGame(Math.random, seats, prev),
  applyAction: otrio.applyAction,
  viewFor: (s, seat) => otrio.viewFor(s, seat),
  decide: (v) => otrio.decide(v),
  withSeat: (a, seat) => {
    const m = (a ?? {}) as Record<string, unknown>;
    return { type: "place", seat, cell: Number(m.cell), size: Number(m.size) as otrio.Size };
  },
  actors: (s) => {
    const color = otrio.currentColor(s);
    return color === null ? [] : [s.owner[color]!];
  },
  pause: () => null,
  over: (s) => s.phase === "gameOver",
  animMs: (prev, next) => (prev && next.moves.length > prev.moves.length ? RING_MS : 0),
  outcome: (s, seat) => ({
    outcome: s.winner === null ? "draw" : s.winner === seat ? "win" : "loss",
    data: {
      pieces: s.moves.filter((m) => m.seat === seat).length,
      // vencedor: a forma da trinca e quantas peças da cor vencedora foram usadas
      ...(s.winner === seat && s.win ? { how: s.win.kind, colorPieces: s.moves.filter((m) => m.color === s.winColor).length } : {}),
      players: s.players.length,
      moves: s.moves.length,
    },
  }),
};

const velhaAdapter: GameAdapter<velha.GameState, velha.Action, velha.PlayerView> = {
  seats: 2,
  settings: {
    initial: velha.DEFAULT_SETTINGS,
    parse: (raw, prev) => velha.parseSettings(raw, prev as velha.Settings),
  },
  newGame: (prev, { settings }) => velha.newGame(Math.random, velha.parseSettings(settings), prev),
  applyAction: velha.applyAction,
  viewFor: (s, seat) => velha.viewFor(s, seat as velha.Seat),
  decide: (v) => velha.decide(v),
  withSeat: (a, seat) => ({ type: "place", cell: Number((a as { cell?: unknown })?.cell), seat: seat as velha.Seat }),
  actors: (s) => (s.phase === "playing" ? [s.turn] : []),
  pause: () => null,
  over: (s) => s.phase === "gameOver",
  animMs: (prev, next) => (prev && next.moves.length > prev.moves.length ? MARK_MS : 0),
  outcome: (s, seat) => ({
    outcome: s.winner === null ? "draw" : s.winner === seat ? "win" : "loss",
    data: {
      pieces: s.moves.filter((m) => m.seat === seat).length,
      starter: s.starter === seat,
      mode: s.settings.mode,
      level: s.settings.level,
      ...(s.winner === seat ? { fork: s.fork } : {}),
    },
  }),
};

const damasAdapter: GameAdapter<damas.GameState, damas.Action, damas.PlayerView> = {
  seats: 2,
  settings: {
    initial: damas.DEFAULT_SETTINGS,
    parse: (raw, prev) => damas.parseSettings(raw, prev as damas.Settings),
  },
  newGame: (prev, { settings }) => damas.newGame(Math.random, damas.parseSettings(settings), prev),
  applyAction: damas.applyAction,
  viewFor: (s, seat) => damas.viewFor(s, seat as damas.Seat),
  decide: (v) => damas.decide(v),
  withSeat: (a, seat) => {
    const { from, path } = (a ?? {}) as { from?: unknown; path?: unknown };
    return { type: "move", seat: seat as damas.Seat, from: Number(from), path: Array.isArray(path) ? path.map(Number) : [] };
  },
  actors: (s) => (s.phase === "playing" ? [s.turn] : []),
  pause: () => null,
  over: (s) => s.phase === "gameOver",
  animMs: (prev, next) => (prev && next.moves.length > prev.moves.length ? next.moves[next.moves.length - 1].path.length * DAMAS_STEP_MS : 0),
  outcome: (s, seat) => {
    const st = s.stats[seat];
    const left = damas.piecesOf(s, seat as damas.Seat);
    return {
      outcome: s.winner === null ? "draw" : s.winner === seat ? "win" : "loss",
      data: {
        moves: s.moves.filter((m) => m.seat === seat).length,
        captured: st.captured,
        bestChain: st.bestChain,
        kings: st.kings,
        left,
        lost: damas.PIECES - left,
        behind: st.behind,
        white: s.white === seat,
        level: s.settings.level,
        end: s.end,
      },
    };
  },
};

const ludoAdapter: GameAdapter<ludo.GameState, ludo.Action, ludo.PlayerView> = {
  seats: ludo.MAX_PLAYERS,
  minSeats: ludo.MIN_PLAYERS,
  newGame: (prev, { seats }) => ludo.newGame(Math.random, seats, prev),
  applyAction: (s, a) => ludo.applyAction(s, a),
  viewFor: (s, seat) => ludo.viewFor(s, seat),
  decide: (v) => ludo.decide(v),
  withSeat: (a, seat) => {
    const m = (a ?? {}) as Record<string, unknown>;
    return m.type === "roll" ? { type: "roll", seat } : { type: "move", seat, piece: Number(m.piece) };
  },
  actors: (s) => (s.phase === "roll" || s.phase === "move" ? [s.order[s.turn]] : []),
  pause: (s) => (s.phase === "pass" ? LUDO_PASS_MS : null),
  // rolar o dado é rápido; escolher a peça leva um pouco mais
  botDelay: (s) => (s.phase === "roll" ? 250 + Math.random() * 250 : 450 + Math.random() * 350),
  over: (s) => s.phase === "gameOver",
  animMs: (prev, next) => {
    if (!prev) return 0;
    if (next.rolls > prev.rolls) return LUDO_DIE_MS;
    if (next.moves.length > prev.moves.length) {
      const m = next.moves[next.moves.length - 1];
      return Math.max(1, m.to - Math.max(0, m.from)) * LUDO_STEP_MS + (m.captured.length ? LUDO_CAPTURE_MS : 0);
    }
    return 0;
  },
  outcome: (s, seat) => {
    const st = s.stats[seat];
    const color = s.colorOf[seat]!;
    return {
      outcome: s.winner === seat ? "win" : "loss",
      placement: ludo.placementOf(s, seat),
      data: {
        players: s.players.length,
        home: ludo.homeCount(s, color),
        captures: st.captures,
        lost: st.lost,
        turns: st.turns,
        comeback: s.winner === seat && st.trailed,
      },
    };
  },
};

const xadrezAdapter: GameAdapter<xadrez.GameState, xadrez.Action, xadrez.PlayerView> = {
  seats: 2,
  settings: {
    initial: xadrez.DEFAULT_SETTINGS,
    parse: (raw, prev) => xadrez.parseSettings(raw, prev as xadrez.Settings),
  },
  newGame: (prev, { settings }) => xadrez.newGame(Math.random, xadrez.parseSettings(settings), prev, Date.now()),
  // o relógio da partida é o do servidor: toda ação leva a hora em que chegou; "advance" confere o tempo
  applyAction: (s, a) => xadrez.applyAction(s, (a as { type: string }).type === "advance" ? { type: "flag", at: Date.now() } : { ...a, at: Date.now() }),
  viewFor: (s, seat) => xadrez.viewFor(s, seat as xadrez.Seat, Date.now()),
  decide: (v) => xadrez.decide(v),
  withSeat: (a, seat) => {
    const m = (a ?? {}) as Record<string, unknown>;
    const s = seat as xadrez.Seat;
    if (m.type === "resign" || m.type === "offerDraw") return { type: m.type, seat: s };
    if (m.type === "answerDraw") return { type: "answerDraw", seat: s, accept: m.accept === true };
    return { type: "move", seat: s, from: Number(m.from), to: Number(m.to), ...(m.promo ? { promo: Number(m.promo) } : {}) };
  },
  // quem recebeu a oferta de empate também pode agir (a IA responde)
  actors: (s) => (s.phase !== "playing" ? [] : s.drawOffer !== null && s.drawOffer === s.turn ? [s.turn, 1 - s.turn] : [s.turn]),
  pause: () => null,
  clock: (s) => (s.clock && s.phase === "playing" ? xadrez.timeLeft(s, Date.now())![s.turn] : null),
  over: (s) => s.phase === "gameOver",
  animMs: (prev, next) => (prev && next.moves.length > prev.moves.length ? XADREZ_MOVE_MS : 0),
  outcome: (s, seat) => {
    const st = s.stats[seat];
    return {
      outcome: s.winner === null ? "draw" : s.winner === seat ? "win" : "loss",
      data: {
        moves: s.moves.filter((m) => m.seat === seat).length,
        captured: st.captured,
        behind: st.behind,
        promotions: st.promotions,
        lostQueen: st.lostQueen,
        white: s.white === seat,
        level: s.settings.level,
        clock: s.settings.clock,
        end: s.end,
      },
    };
  },
};

export const GAMES: Record<GameId, GameAdapter> = {
  "truco-paulista": trucoAdapter,
  connect4: connect4Adapter,
  stop: stopAdapter,
  "batalha-naval": batalhaNavalAdapter,
  codenames: codenamesAdapter,
  otrio: otrioAdapter,
  "jogo-da-velha": velhaAdapter,
  damas: damasAdapter,
  ludo: ludoAdapter,
  xadrez: xadrezAdapter,
};
