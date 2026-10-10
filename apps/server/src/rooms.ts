import type { ServerWebSocket } from "bun";
import type { ClientMsg, GameId, RoomInfo, Seat, ServerMsg } from "@truco/game";
import { GAMES, type GameAdapter } from "./games";

export interface WsData {
  token?: string;
  name?: string;
}
type Socket = ServerWebSocket<WsData>;

interface Slot {
  kind: "empty" | "human" | "bot";
  token?: string;
  name: string;
}

interface Room {
  code: string;
  game: GameId;
  adapter: GameAdapter;
  solo: boolean;
  host: string;
  members: Map<string, string>; // token -> nome
  seats: Slot[];
  state: unknown | null;
  timer?: ReturnType<typeof setTimeout>;
  dealUntil: number;
  cleanup?: ReturnType<typeof setTimeout>;
}

const BOT_NAMES = ["Zé", "Tião", "Cida", "Juca", "Nena", "Dito", "Lurdes", "Chico"];
const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ";

const rooms = new Map<string, Room>();
const sockets = new Map<string, Socket>();
const roomOf = new Map<string, string>(); // token -> code

const emptySlot = (): Slot => ({ kind: "empty", name: "" });

function send(ws: Socket, msg: ServerMsg) {
  ws.send(JSON.stringify(msg));
}

function newCode(): string {
  let code = "";
  do {
    code = Array.from({ length: 4 }, () => CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]).join("");
  } while (rooms.has(code));
  return code;
}

function botName(room: Room): string {
  const used = new Set(room.seats.map((s) => s.name));
  return BOT_NAMES.find((n) => !used.has(n)) ?? "IA";
}

const seatOf = (room: Room, token: string): Seat | null => {
  const i = room.seats.findIndex((s) => s.kind === "human" && s.token === token);
  return i < 0 ? null : (i as Seat);
};

const isConnected = (token?: string) => !!token && sockets.has(token);

const humanControlled = (room: Room, seat: Seat) => {
  const s = room.seats[seat];
  return s.kind === "human" && isConnected(s.token);
};

function info(room: Room, token: string): RoomInfo {
  const seated = new Set(room.seats.map((s) => s.token).filter(Boolean));
  return {
    code: room.code,
    game: room.game,
    solo: room.solo,
    started: !!room.state,
    isHost: room.host === token,
    mySeat: seatOf(room, token),
    seats: room.seats.map((s) => ({
      kind: s.kind,
      name: s.name,
      connected: s.kind === "bot" || (s.kind === "human" && isConnected(s.token)),
    })),
    waiting: [...room.members].filter(([t]) => !seated.has(t)).map(([, n]) => n),
  };
}

function broadcast(room: Room) {
  for (const token of room.members.keys()) {
    const ws = sockets.get(token);
    if (!ws) continue;
    const seat = seatOf(room, token);
    const view = room.state && seat !== null ? room.adapter.viewFor(room.state, seat) : null;
    send(ws, { t: "room", room: info(room, token), view });
  }
}

function findBotActor(room: Room): Seat | null {
  const actors = room.adapter.actors(room.state) as Seat[];
  if (actors.length === 0 || actors.some((s) => humanControlled(room, s))) return null;
  return actors[0];
}

function schedule(room: Room) {
  clearTimeout(room.timer);
  const g = room.state;
  if (!g || room.adapter.over(g)) return;
  const pause = room.adapter.pause(g);
  if (pause !== null) {
    room.timer = setTimeout(() => step(room, { type: "advance" }), pause);
    return;
  }
  const actor = findBotActor(room);
  if (actor === null) return;
  room.timer = setTimeout(() => {
    if (!room.state) return;
    const a = room.adapter.decide(room.adapter.viewFor(room.state, actor));
    if (a) step(room, a);
  }, 650 + Math.random() * 650 + Math.max(0, room.dealUntil - Date.now()));
}

// bots esperam a animação do cliente (distribuição, peça caindo) antes de agir
function markAnim(room: Room, prev: unknown | null) {
  const ms = room.adapter.animMs(prev, room.state);
  if (ms > 0) room.dealUntil = Date.now() + ms;
}

function step(room: Room, action: unknown): string | null {
  if (!room.state) return "sem partida";
  const prev = room.state;
  const r = room.adapter.applyAction(prev, action);
  if (!r.ok) return r.error;
  room.state = r.state;
  markAnim(room, prev);
  broadcast(room);
  schedule(room);
  return null;
}

function startGame(room: Room) {
  room.state = room.adapter.newGame(room.state);
  markAnim(room, null);
  broadcast(room);
  schedule(room);
}

function deleteRoom(room: Room) {
  clearTimeout(room.timer);
  clearTimeout(room.cleanup);
  for (const t of room.members.keys()) roomOf.delete(t);
  rooms.delete(room.code);
}

function checkEmpty(room: Room) {
  clearTimeout(room.cleanup);
  const anyone = [...room.members.keys()].some(isConnected);
  if (!anyone) room.cleanup = setTimeout(() => deleteRoom(room), room.solo ? 60_000 : 5 * 60_000);
}

function leaveRoom(token: string) {
  const code = roomOf.get(token);
  const room = code ? rooms.get(code) : undefined;
  roomOf.delete(token);
  if (!room) return;
  room.members.delete(token);
  const seat = seatOf(room, token);
  if (seat !== null) {
    room.seats[seat] = room.state ? { kind: "bot", name: botName(room) } : emptySlot();
  }
  if (room.members.size === 0) return deleteRoom(room);
  if (room.host === token) room.host = room.members.keys().next().value!;
  broadcast(room);
  schedule(room);
}

function joinRoom(room: Room, token: string, name: string) {
  if (roomOf.get(token) !== room.code) leaveRoom(token);
  room.members.set(token, name);
  roomOf.set(token, room.code);
  const seat = seatOf(room, token);
  if (seat !== null) room.seats[seat].name = name;
  clearTimeout(room.cleanup);
}

export function handleMessage(ws: Socket, msg: ClientMsg<unknown>) {
  if (msg.t === "hello") {
    const name = String(msg.name || "Jogador").slice(0, 16);
    const prev = sockets.get(msg.token);
    if (prev && prev !== ws) prev.close(4000, "replaced");
    ws.data.token = msg.token;
    ws.data.name = name;
    sockets.set(msg.token, ws);
    const room = rooms.get(roomOf.get(msg.token) ?? "");
    if (room) {
      room.members.set(msg.token, name);
      const seat = seatOf(room, msg.token);
      if (seat !== null) room.seats[seat].name = name;
      clearTimeout(room.cleanup);
      broadcast(room);
      schedule(room);
    }
    return;
  }

  const token = ws.data.token;
  if (!token) return send(ws, { t: "error", message: "hello primeiro" });
  const name = ws.data.name ?? "Jogador";
  const error = (message: string) => send(ws, { t: "error", message });

  if (msg.t === "create") {
    const game: GameId = msg.game && Object.hasOwn(GAMES, msg.game) ? msg.game : "truco-paulista";
    const adapter = GAMES[game];
    const room: Room = {
      code: newCode(),
      game,
      adapter,
      solo: !!msg.solo,
      host: token,
      members: new Map(),
      seats: Array.from({ length: adapter.seats }, emptySlot),
      state: null,
      dealUntil: 0,
    };
    rooms.set(room.code, room);
    joinRoom(room, token, name);
    room.seats[0] = { kind: "human", token, name };
    if (room.solo) {
      for (let s = 1; s < adapter.seats; s++) room.seats[s] = { kind: "bot", name: botName(room) };
      room.state = adapter.newGame(null);
      markAnim(room, null);
    }
    send(ws, { t: "created", code: room.code });
    broadcast(room);
    schedule(room);
    return;
  }

  if (msg.t === "join") {
    const room = rooms.get(String(msg.code).toUpperCase());
    if (!room) return error("Sala não encontrada");
    if (room.solo && !room.members.has(token)) return error("Sala não encontrada");
    joinRoom(room, token, name);
    broadcast(room);
    schedule(room);
    return;
  }

  const room = rooms.get(roomOf.get(token) ?? "");
  if (!room) return error("Sem sala");
  const isHost = room.host === token;

  switch (msg.t) {
    case "leave":
      leaveRoom(token);
      send(ws, { t: "left" });
      return;
    case "sit": {
      if (room.state) return error("Partida em andamento");
      if (room.seats[msg.seat]?.kind !== "empty") return error("Lugar ocupado");
      const cur = seatOf(room, token);
      if (cur !== null) room.seats[cur] = emptySlot();
      room.seats[msg.seat] = { kind: "human", token, name };
      break;
    }
    case "stand": {
      if (room.state) return;
      const cur = seatOf(room, token);
      if (cur !== null) room.seats[cur] = emptySlot();
      break;
    }
    case "addBot":
      if (!isHost || room.state || room.seats[msg.seat]?.kind !== "empty") return;
      room.seats[msg.seat] = { kind: "bot", name: botName(room) };
      break;
    case "removeBot":
      if (!isHost || room.state || room.seats[msg.seat]?.kind !== "bot") return;
      room.seats[msg.seat] = emptySlot();
      break;
    case "start":
      if (!isHost || room.state) return;
      if (room.seats.some((s) => s.kind === "empty")) return error("Complete a mesa");
      return startGame(room);
    case "restart":
      if (!isHost || !room.state || !room.adapter.over(room.state)) return;
      return startGame(room);
    case "action": {
      const seat = seatOf(room, token);
      if (seat === null || !room.state) return;
      const err = step(room, room.adapter.withSeat(msg.action, seat));
      if (err) error(err);
      return;
    }
  }
  broadcast(room);
}

export function handleClose(ws: Socket) {
  const token = ws.data.token;
  if (!token || sockets.get(token) !== ws) return;
  sockets.delete(token);
  const room = rooms.get(roomOf.get(token) ?? "");
  if (!room) return;
  if (!room.state) {
    // antes do jogo, quem sai libera o lugar depois de um tempo sem voltar
    setTimeout(() => {
      if (!isConnected(token) && !room.state && rooms.has(room.code)) {
        const seat = seatOf(room, token);
        if (seat !== null) room.seats[seat] = emptySlot();
        broadcast(room);
      }
    }, 30_000);
  }
  broadcast(room);
  schedule(room);
  checkEmpty(room);
}
