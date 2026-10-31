import type { ClientMsg } from "@mesa/truco";
import { startDailyScheduler, startPushScheduler } from "./daily";
import { handleClose, handleMessage, roomPreview, type WsData } from "./rooms";

const port = Number(process.env.PORT ?? 3001);

Bun.serve<WsData>({
  port,
  hostname: "0.0.0.0",
  fetch(req, server) {
    // prévia do convite: o site monta a imagem e o título do link da sala com isto
    const preview = new URL(req.url).pathname.match(/^\/sala\/([A-Za-z]{4})$/);
    if (preview) {
      const r = roomPreview(preview[1]);
      return r ? Response.json(r, { headers: { "cache-control": "no-store" } }) : new Response(null, { status: 404 });
    }
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
startPushScheduler();
