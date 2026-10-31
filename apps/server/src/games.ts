import * as truco from "@mesa/truco";
import * as c4 from "@mesa/connect4";
import * as stop from "@mesa/stop";
import * as bn from "@mesa/batalha-naval";
import * as cn from "@mesa/codenames";
import * as otrio from "@mesa/otrio";
import * as velha from "@mesa/jogo-da-velha";
import * as damas from "@mesa/damas";
import * as ludo from "@mesa/ludo";
import * as domino from "@mesa/domino";
import * as buraco from "@mesa/buraco";
import * as bj from "@mesa/blackjack";
import * as xadrez from "@mesa/xadrez";
import * as futebol from "@mesa/futebol-de-botao";
import * as tijolada from "@mesa/tijolada";
import * as sinuca from "@mesa/sinuca";
import * as memoria from "@mesa/jogo-da-memoria";
import type { GameId, PlayerReport } from "@mesa/truco";

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
  /**
   * Jogo em tempo real: o servidor roda `step` a cada `tickMs` sem esperar ação, os bots decidem a cada
   * `botEvery` passos e a visão sai a cada `frameEvery` passos (mensagem `frame`, sem os dados da sala).
   */
  realtime?: { tickMs: number; step(s: S): S; botEvery: number; frameEvery: number };
  /** Ação que tira da partida quem saiu da sala (sem ela, o lugar segue com a IA ou parado). */
  abandon?(s: S, seat: number): A;
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
// Peças distribuídas no dominó, peça entrando na mesa, aviso de quem passou e peça comprada
const DOMINO_DEAL_MS = 1500;
const DOMINO_PLAY_MS = 450;
const DOMINO_PASS_MS = 900;
const DOMINO_DRAW_MS = 300;
// Mãos abertas e pontos da mão na tela antes da próxima
const DOMINO_HAND_END_MS = 4200;
// Buraco: cartas distribuídas, cada lance na mesa e a contagem de pontos da mão na tela antes da próxima
const BURACO_DEAL_MS = 2600;
const BURACO_EVENT_MS: Record<buraco.Event["kind"], number> = { draw: 350, take: 900, meld: 600, add: 450, discard: 500, morto: 1100, batida: 800 };
const BURACO_HAND_END_MS = 10000;
// Dado parado na tela antes de a vez passar (sem lance ou 3º seis)
const LUDO_PASS_MS = 1300;
// Blackjack: embaralhar, cada carta saindo do sapato, divisão, carta da banca virando; pausa entre os
// passos da banca e acerto da rodada na tela antes das próximas apostas
const BJ_SHUFFLE_MS = 900;
const BJ_CARD_MS = 180;
const BJ_SPLIT_MS = 450;
const BJ_REVEAL_MS = 500;
const BJ_DEALER_STEP_MS = 750;
const BJ_SETTLE_MS = 3200;
const BJ_EVENT_MS: Record<bj.Event["kind"], number> = {
  shuffle: BJ_SHUFFLE_MS,
  bet: 250,
  deal: 0,
  hit: 400,
  double: 450,
  split: BJ_SPLIT_MS,
  stand: 0,
  bust: 300,
  insurance: 250,
  reveal: BJ_REVEAL_MS,
  dealerHit: 400,
  settle: 0,
};
/** Tempo na tela dos eventos novos (a distribuição pelo número de cartas). */
const bjEventsMs = (events: bj.Event[]) =>
  events.reduce((ms, e) => ms + (e.kind === "deal" ? 300 + e.cards * BJ_CARD_MS : BJ_EVENT_MS[e.kind]), 0);
/** Eventos desde a última distribuição (a rodada que está na mesa). */
const bjSinceDeal = (s: bj.GameState) => {
  const i = s.events.map((e) => e.kind).lastIndexOf("deal");
  return i < 0 ? [] : s.events.slice(i);
};

const trucoAdapter: GameAdapter<truco.GameState, truco.Action, truco.PlayerView> = {
  seats: 4,
  // mesa cheia (duplas) ou dois em times diferentes (1×1)
  minSeats: 2,
  canStart: truco.validPlayers,
  newGame: (_prev, { seats }) =>
    truco.newGame(Math.random, seats[Math.floor(Math.random() * seats.length)] as truco.Seat, seats as truco.Seat[]),
  applyAction: truco.applyAction,
  viewFor: (s, seat) => truco.viewFor(s, seat as truco.Seat),
  decide: (v) => truco.decide(v),
  withSeat: (a, seat) => truco.withSeat(a as truco.ClientAction, seat as truco.Seat),
  actors: (s) =>
    s.players.filter((seat) => {
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
      data: { scores: [s.scores[team], s.scores[1 - team]], hands: s.handNo, players: s.players.length },
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

const dominoAdapter: GameAdapter<domino.GameState, domino.Action, domino.PlayerView> = {
  seats: domino.SEATS,
  minSeats: 2,
  canStart: domino.validPlayers,
  newGame: (prev, { seats }) => domino.newGame(Math.random, seats, prev),
  applyAction: (s, a) => domino.applyAction(s, a),
  viewFor: (s, seat) => domino.viewFor(s, seat),
  decide: (v) => domino.decide(v),
  withSeat: (a, seat) => {
    const m = (a ?? {}) as Record<string, unknown>;
    if (m.type === "draw") return { type: "draw", seat };
    const t = Array.isArray(m.tile) ? m.tile.map(Number) : [];
    return {
      type: "play",
      seat,
      tile: [t[0], t[1]] as domino.Tile,
      ...(m.side === "left" || m.side === "right" ? { side: m.side } : {}),
    };
  },
  actors: (s) => (s.phase === "playing" ? [s.turn] : []),
  pause: (s) => (s.phase === "handEnd" ? DOMINO_HAND_END_MS : null),
  // comprar é rápido; escolher a peça leva um pouco mais
  botDelay: (s) => (domino.canPlaySeat(s, s.turn) ? 700 + Math.random() * 600 : 300 + Math.random() * 200),
  over: (s) => s.phase === "gameOver",
  animMs: (prev, next) => {
    if (!prev || prev.handNo !== next.handNo || prev.gameNo !== next.gameNo) return DOMINO_DEAL_MS;
    const added = next.events.slice(prev.events.length);
    return added.reduce((ms, e) => ms + (e.kind === "play" ? DOMINO_PLAY_MS : e.kind === "pass" ? DOMINO_PASS_MS : DOMINO_DRAW_MS), 0);
  },
  outcome: (s, seat) => {
    const team = domino.teamOf(seat);
    const st = s.stats[seat];
    return {
      outcome: s.winner === team ? "win" : "loss",
      data: {
        mode: s.mode,
        scores: [s.scores[team], s.scores[1 - team]],
        hands: s.handNo,
        wins: { ...st.wins },
        closed: st.closed,
        deficit: s.maxDeficit[team],
      },
    };
  },
};

const buracoAdapter: GameAdapter<buraco.GameState, buraco.Action, buraco.PlayerView> = {
  seats: buraco.SEATS,
  minSeats: 2,
  canStart: buraco.validPlayers,
  newGame: (prev, { seats }) => buraco.newGame(Math.random, seats, prev),
  applyAction: (s, a) => buraco.applyAction(s, a),
  viewFor: (s, seat) => buraco.viewFor(s, seat),
  decide: (v) => buraco.decide(v),
  withSeat: (a, seat) => {
    const m = (a ?? {}) as Record<string, unknown>;
    const list = (x: unknown) => (Array.isArray(x) ? x.filter((i): i is string => typeof i === "string").slice(0, 30) : []);
    const wildAt = typeof m.wildAt === "number" && Number.isInteger(m.wildAt) ? { wildAt: m.wildAt } : {};
    switch (m.type) {
      case "draw":
        return { type: "draw", seat };
      case "take":
        return { type: "take", seat, cards: list(m.cards), meld: typeof m.meld === "string" ? m.meld : null, ...wildAt };
      case "meld":
        return { type: "meld", seat, cards: list(m.cards), ...wildAt };
      case "add":
        return { type: "add", seat, meld: String(m.meld ?? ""), cards: list(m.cards), ...wildAt };
      default:
        return { type: "discard", seat, card: String(m.card ?? "") };
    }
  },
  actors: (s) => (s.phase === "playing" ? [s.turn] : []),
  pause: (s) => (s.phase === "handEnd" ? BURACO_HAND_END_MS : null),
  // comprar é rápido; baixar e descartar levam um pouco mais
  botDelay: (s) => (s.step === "draw" ? 650 + Math.random() * 450 : 600 + Math.random() * 400),
  over: (s) => s.phase === "gameOver",
  animMs: (prev, next) => {
    if (!prev || prev.handNo !== next.handNo || prev.gameNo !== next.gameNo) return BURACO_DEAL_MS;
    const fresh = Math.min(Math.max(0, next.eventNo - prev.eventNo), next.events.length);
    return next.events.slice(next.events.length - fresh).reduce((ms, e) => ms + BURACO_EVENT_MS[e.kind], 0);
  },
  outcome: (s, seat) => {
    const team = buraco.teamOf(seat);
    const st = s.stats[seat];
    const ts = s.teamStats[team];
    return {
      outcome: s.winner === team ? "win" : "loss",
      data: {
        mode: s.mode,
        scores: [s.scores[team], s.scores[1 - team]],
        hands: s.handNo,
        limpa: ts.limpa,
        suja: ts.suja,
        real: ts.real,
        bestHand: ts.bestHand,
        maxPile: st.maxPile,
        batidas: st.batidas,
        deficit: s.maxDeficit[team],
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

const futebolAdapter: GameAdapter<futebol.GameState, futebol.Action, futebol.PlayerView> = {
  seats: futebol.MAX_PLAYERS,
  minSeats: 2,
  // pelo menos um botão em cada time
  canStart: (seats) => seats.some((s) => futebol.teamOf(s) === 0) && seats.some((s) => futebol.teamOf(s) === 1),
  newGame: (_prev, { seats }) => futebol.newGame(seats),
  applyAction: futebol.applyAction,
  viewFor: (s, seat) => futebol.viewFor(s, seat),
  spectate: (s) => futebol.viewFor(s, null),
  decide: (v) => futebol.decide(v),
  withSeat: (a, seat) => {
    const m = (a ?? {}) as Record<string, unknown>;
    return { type: "input", seat, dx: Number(m.dx), dy: Number(m.dy), kick: m.kick === true };
  },
  actors: (s) => (s.phase === "over" ? [] : s.players.map((p) => p.seat)),
  pause: () => null,
  over: futebol.isOver,
  animMs: () => 0,
  realtime: { tickMs: futebol.TICK_MS, step: futebol.step, botEvery: 3, frameEvery: 2 },
  outcome: (s, seat) => {
    const team = futebol.teamOf(seat);
    const other = (1 - team) as futebol.Team;
    const size = (t: number) => s.players.filter((p) => p.team === t).length;
    return {
      outcome: s.winner === team ? "win" : "loss",
      data: {
        gf: s.score[team],
        ga: s.score[other],
        goals: s.goals.filter((g) => g.seat === seat && !g.own).length,
        size: Math.max(size(0), size(1)),
        ms: Math.round(s.tick * futebol.TICK_MS),
        golden: s.golden,
        deficit: s.maxDeficit[team],
      },
    };
  },
};

const tijoladaAdapter: GameAdapter<tijolada.VersusState, tijolada.VersusAction, tijolada.VersusView> = {
  seats: 2,
  bots: false,
  newGame: (prev, { seats }) => tijolada.newVersus(seats, Math.floor(Math.random() * 2 ** 31), prev),
  applyAction: tijolada.applyVersus,
  viewFor: (s, seat) => tijolada.versusView(s, seat),
  spectate: (s) => tijolada.versusView(s, null),
  decide: () => null,
  withSeat: (a, seat) => {
    const m = (a ?? {}) as Record<string, unknown>;
    return { type: "input", seat, tick: Number(m.tick), key: m.key as tijolada.Key };
  },
  actors: (s) => (s.phase === "over" ? [] : s.players),
  pause: () => null,
  over: tijolada.isVersusOver,
  animMs: () => 0,
  // cada navegador roda a própria partida; o servidor refaz e manda o campo do adversário ~10 vezes por segundo
  realtime: { tickMs: tijolada.TICK_MS, step: tijolada.stepVersus, botEvery: 60, frameEvery: 6 },
  abandon: (_s, seat) => ({ type: "abandon", seat }),
  outcome: tijolada.versusOutcome,
};

const sinucaAdapter: GameAdapter<sinuca.GameState, sinuca.Action, sinuca.PlayerView> = {
  seats: sinuca.MAX_PLAYERS,
  // 1×1 ou 2×2
  minSeats: 2,
  canStart: sinuca.validPlayers,
  settings: {
    initial: sinuca.DEFAULT_SETTINGS,
    parse: (raw, prev) => sinuca.parseSettings(raw, prev as sinuca.Settings),
  },
  newGame: (prev, { seats, settings }) => sinuca.newGame(Math.random, seats, sinuca.parseSettings(settings), prev, Date.now()),
  // o relógio da tacada é o do servidor: toda ação leva a hora em que chegou; "advance" é o tempo estourado
  applyAction: (s, a) => sinuca.applyAction(s, (a as { type: string }).type === "advance" ? { type: "timeout", at: Date.now() } : { ...a, at: Date.now() }),
  viewFor: (s, seat) => sinuca.viewFor(s, seat, Date.now()),
  spectate: (s) => sinuca.viewFor(s, null, Date.now()),
  decide: (v) => sinuca.decide(v),
  withSeat: (a, seat) => {
    const m = (a ?? {}) as Record<string, unknown>;
    const shot = (m.shot ?? {}) as Record<string, unknown>;
    const place = m.place as Record<string, unknown> | undefined;
    return {
      type: "shot",
      seat,
      shot: { dx: Number(shot.dx), dy: Number(shot.dy), power: Number(shot.power), spinX: Number(shot.spinX), spinY: Number(shot.spinY) },
      ...(place ? { place: { x: Number(place.x), y: Number(place.y) } } : {}),
      ...(m.call !== undefined ? { call: Number(m.call) } : {}),
      at: 0,
    };
  },
  actors: (s) => (s.phase === "over" ? [] : [s.turn]),
  pause: () => null,
  clock: (s) => (s.deadline === null || s.phase === "over" ? null : Math.max(0, s.deadline - Date.now())),
  // o bot "mira" um pouco antes de bater
  botDelay: () => 1100 + Math.random() * 900,
  over: (s) => s.phase === "over",
  animMs: (prev, next) => (next.last && (!prev || prev.shotNo !== next.shotNo) ? next.last.ms : 0),
  outcome: (s, seat) => {
    const team = sinuca.teamOf(seat);
    const other = (1 - team) as sinuca.Team;
    const st = s.stats[seat];
    const theirs = s.groups[other];
    return {
      outcome: s.winner === team ? "win" : "loss",
      data: {
        shots: st.shots,
        potted: st.potted,
        run: st.bestRun,
        double: st.bestShot,
        fouls: st.fouls,
        breakPot: st.breakPot,
        // quebrou e ganhou sem o adversário dar uma tacada
        clean: s.winner === team && sinuca.teamOf(s.breaker) === team && s.teamShots[other] === 0,
        // bolas do adversário na mesa no fim
        left: theirs === null ? 7 : s.balls.filter((b) => sinuca.groupOf(b.n) === theirs).length,
        level: s.settings.level,
        players: s.players.length,
        end: s.end,
      },
    };
  },
};

const blackjackAdapter: GameAdapter<bj.GameState, bj.Action, bj.PlayerView> = {
  seats: bj.SEATS,
  minSeats: 1,
  simultaneous: true,
  settings: {
    initial: bj.DEFAULT_SETTINGS,
    parse: (raw, prev) => bj.parseSettings(raw, prev as bj.Settings),
  },
  newGame: (prev, { seats, settings }) => bj.newGame(Math.random, { players: seats, settings: bj.parseSettings(settings) }, prev, Date.now()),
  // o relógio das decisões é o do servidor: toda ação leva a hora em que chegou
  applyAction: (s, a) => bj.applyAction(s, { ...a, at: Date.now() }),
  viewFor: (s, seat) => bj.viewFor(s, seat, Date.now()),
  spectate: (s) => bj.viewFor(s, null, Date.now()),
  decide: (v) => bj.decide(v),
  withSeat: (a, seat) => {
    const m = (a ?? {}) as Record<string, unknown>;
    switch (m.type) {
      case "bet":
        return { type: "bet", seat, amount: Number(m.amount) };
      case "insurance":
        return { type: "insurance", seat, take: m.take === true };
      case "hit":
      case "double":
      case "split":
        return { type: m.type, seat };
      default:
        return { type: "stand", seat };
    }
  },
  actors: bj.actors,
  pause: (s) => {
    if (s.phase === "dealer") {
      // banca espera a última carta (ou a distribuição, se ninguém jogou) chegar na mesa
      const last = s.events[s.events.length - 1];
      return BJ_DEALER_STEP_MS + (last?.kind === "deal" ? bjEventsMs([last]) : 0);
    }
    if (s.phase === "settle") {
      const round = bjSinceDeal(s);
      // banca abriu blackjack logo na distribuição: a mesa ainda está recebendo as cartas
      const quick = round.every((e) => e.kind === "deal" || e.kind === "reveal" || e.kind === "settle" || e.kind === "insurance");
      return BJ_SETTLE_MS + (quick ? bjEventsMs(round) : 0);
    }
    return null;
  },
  clock: (s) => (s.deadline === null ? null : Math.max(0, s.deadline - Date.now())),
  // apostar é rápido; cada decisão na vez leva um pouco mais
  botDelay: (s) => (s.phase === "bet" ? 400 + Math.random() * 700 : s.phase === "insurance" ? 500 + Math.random() * 400 : 700 + Math.random() * 500),
  over: (s) => s.phase === "gameOver",
  animMs: (prev, next) => {
    if (!prev || prev.gameNo !== next.gameNo) return bjEventsMs(next.events);
    const fresh = Math.min(Math.max(0, next.eventNo - prev.eventNo), next.events.length);
    return bjEventsMs(next.events.slice(next.events.length - fresh));
  },
  outcome: (s, seat) => {
    const p = s.table[seat];
    if (!p) return { outcome: "loss", data: {} };
    const st = p.stats;
    return {
      outcome: p.chips > bj.START_CHIPS ? "win" : p.chips < bj.START_CHIPS ? "loss" : "draw",
      placement: bj.placementOf(s, seat),
      data: {
        rounds: s.settings.rounds,
        played: st.rounds,
        final: p.chips,
        profit: p.chips - bj.START_CHIPS,
        peak: st.peak,
        low: st.low,
        bestRound: st.bestRound,
        handsPlayed: st.handsPlayed,
        handsWon: st.handsWon,
        blackjacks: st.blackjacks,
        doublesWon: st.doublesWon,
        splits: st.splits,
        splitSweeps: st.splitSweeps,
        busts: st.busts,
        players: s.players.length,
      },
    };
  },
};

const memoriaAdapter: GameAdapter<memoria.GameState, memoria.Action, memoria.PlayerView> = {
  seats: 2,
  minSeats: 2,
  newGame: (prev, { seats, settings }) => memoria.newGame(Math.random, seats, memoria.parseSettings(settings), prev, Date.now()),
  applyAction: (s, a) => memoria.applyAction(s, a, Date.now()),
  viewFor: memoria.viewFor,
  spectate: s => memoria.viewFor(s, -1),
  decide: v => memoria.decide(v),
  withSeat: (raw, seat) => ({ type: "flip", seat, index: (raw as memoria.ClientAction | null)?.type === "flip" ? (raw as memoria.ClientAction).index : NaN }),
  actors: s => s.phase === "playing" ? [s.turn] : [],
  pause: s => s.phase === "reveal" ? memoria.REVEAL_MS : null,
  over: s => s.phase === "gameOver",
  animMs: prev => prev ? 350 : memoria.DEAL_MS,
  outcome: (s, seat) => {
    const st = s.stats[seat];
    return {
      outcome: s.winners.includes(seat) ? s.winners.length > 1 ? "draw" : "win" : "loss",
      placement: 1 + s.players.filter(p => s.stats[p].pairs > st.pairs).length,
      data: { ...st, players: s.players.length, level: s.settings.level, timeMs: Math.max(0, (s.finishedAt ?? s.startedAt) - s.startedAt) },
    };
  },
};

export const GAMES: Record<GameId, GameAdapter> = {
  "jogo-da-memoria": memoriaAdapter,
  "truco-paulista": trucoAdapter,
  connect4: connect4Adapter,
  stop: stopAdapter,
  "batalha-naval": batalhaNavalAdapter,
  codenames: codenamesAdapter,
  otrio: otrioAdapter,
  "jogo-da-velha": velhaAdapter,
  damas: damasAdapter,
  ludo: ludoAdapter,
  domino: dominoAdapter,
  buraco: buracoAdapter,
  xadrez: xadrezAdapter,
  "futebol-de-botao": futebolAdapter,
  tijolada: tijoladaAdapter,
  blackjack: blackjackAdapter,
  sinuca: sinucaAdapter,
};
