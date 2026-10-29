// Service worker mínimo: deixa o Mesa instalável. Não guarda nada em cache (as partidas dependem do servidor ao vivo).
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));
self.addEventListener("fetch", () => {});
