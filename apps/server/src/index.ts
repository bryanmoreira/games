import type { ClientMsg } from "@truco/game";
import { startDailyScheduler } from "./daily";
import { handleClose, handleMessage, type WsData } from "./rooms";

const port = Number(process.env.PORT ?? 3001);

Bun.serve<WsData>({
  port,
  hostname: "0.0.0.0",
  fetch(req, server) {
    if (server.upgrade(req, { data: {} })) return;
    return new Response("truco ws");
  },
  websocket: {
    idleTimeout: 120,
    sendPings: true,
    message(ws, raw) {
      let msg: ClientMsg<unknown>;
      try {
        msg = JSON.parse(String(raw));
      } catch {
        return;
      }
      handleMessage(ws, msg);
    },
    close(ws) {
      handleClose(ws);
    },
  },
});

console.log(`truco ws on :${port}`);
startDailyScheduler();
