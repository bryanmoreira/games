import type { ServerWebSocket } from "bun";
import {
  applyAction, decide, newGame, viewFor, withSeat,
  type Action, type ClientMsg, type GameState, type RoomInfo, type Seat, type ServerMsg,
} from "@truco/game";

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
  solo: boolean;
  host: string;
  members: Map<string, string>; // token -> nome
  seats: Slot[];
  game: GameState | null;
  timer?: ReturnType<typeof setTimeout>;
  cleanup?: ReturnType<typeof setTimeout>;
}

const BOT_NAMES = ["Zé", "Tião", "Cida", "Juca", "Nena", "Dito", "Lurdes", "Chico"];
const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ";
const SEATS: Seat[] = [0, 1, 2, 3];

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
    solo: room.solo,
    started: !!room.game,
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
    const view = room.game && seat !== null ? viewFor(room.game, seat) : null;
    send(ws, { t: "room", room: info(room, token), view });
  }
}

function findBotActor(room: Room): Seat | null {
  const g = room.game!;
  const actors = SEATS.filter((seat) => {
    const v = viewFor(g, seat);
    return v.canPlay || v.mustRespond || v.mustDecideMao11;
  });
  if (actors.length === 0 || actors.some((s) => humanControlled(room, s))) return null;
  return actors[0];
}

function schedule(room: Room) {
  clearTimeout(room.timer);
  const g = room.game;
  if (!g || g.phase === "gameOver") return;
  if (g.phase === "roundEnd" || g.phase === "handEnd") {
    room.timer = setTimeout(() => step(room, { type: "advance" }), g.phase === "roundEnd" ? 1400 : 2600);
    return;
  }
  const actor = findBotActor(room);
  if (actor === null) return;
  room.timer = setTimeout(() => {
    if (!room.game) return;
    const a = decide(viewFor(room.game, actor));
    if (a) step(room, a);
  }, 650 + Math.random() * 650);
}

function step(room: Room, action: Action): string | null {
  if (!room.game) return "sem partida";
  const r = applyAction(room.game, action);
  if (!r.ok) return r.error;
  room.game = r.state;
  broadcast(room);
  schedule(room);
  return null;
}

function startGame(room: Room) {
  room.game = newGame(Math.random, Math.floor(Math.random() * 4) as Seat);
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
    room.seats[seat] = room.game ? { kind: "bot", name: botName(room) } : emptySlot();
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

export function handleMessage(ws: Socket, msg: ClientMsg) {
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
    const room: Room = {
      code: newCode(),
      solo: !!msg.solo,
      host: token,
      members: new Map(),
      seats: SEATS.map(emptySlot),
      game: null,
    };
    rooms.set(room.code, room);
    joinRoom(room, token, name);
    room.seats[0] = { kind: "human", token, name };
    if (room.solo) {
      for (const s of [1, 2, 3]) room.seats[s] = { kind: "bot", name: botName(room) };
      room.game = newGame(Math.random, Math.floor(Math.random() * 4) as Seat);
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
      if (room.game) return error("Partida em andamento");
      if (room.seats[msg.seat]?.kind !== "empty") return error("Lugar ocupado");
      const cur = seatOf(room, token);
      if (cur !== null) room.seats[cur] = emptySlot();
      room.seats[msg.seat] = { kind: "human", token, name };
      break;
    }
    case "stand": {
      if (room.game) return;
      const cur = seatOf(room, token);
      if (cur !== null) room.seats[cur] = emptySlot();
      break;
    }
    case "addBot":
      if (!isHost || room.game || room.seats[msg.seat]?.kind !== "empty") return;
      room.seats[msg.seat] = { kind: "bot", name: botName(room) };
      break;
    case "removeBot":
      if (!isHost || room.game || room.seats[msg.seat]?.kind !== "bot") return;
      room.seats[msg.seat] = emptySlot();
      break;
    case "start":
      if (!isHost || room.game) return;
      if (room.seats.some((s) => s.kind === "empty")) return error("Complete a mesa");
      return startGame(room);
    case "restart":
      if (!isHost || room.game?.phase !== "gameOver") return;
      return startGame(room);
    case "action": {
      const seat = seatOf(room, token);
      if (seat === null || !room.game) return;
      const err = step(room, withSeat(msg.action, seat));
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
  if (!room.game) {
    // antes do jogo, quem sai libera o lugar depois de um tempo sem voltar
    setTimeout(() => {
      if (!isConnected(token) && !room.game && rooms.has(room.code)) {
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
