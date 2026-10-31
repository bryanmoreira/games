// Service worker mínimo: deixa o Mesa instalável e recebe o lembrete do desafio do dia (Web Push).
// Não guarda nada em cache (as partidas dependem do servidor ao vivo).
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));
self.addEventListener("fetch", () => {});

self.addEventListener("push", (e) => {
  let d = {};
  try {
    d = e.data ? e.data.json() : {};
  } catch {}
  e.waitUntil(
    self.registration.showNotification(d.title || "Mesa de Jogos", {
      body: d.body || "O desafio de hoje já está no ar.",
      icon: "/pwa-icon/192",
      badge: "/pwa-icon/192",
      tag: d.tag || "diario",
      data: { url: d.url || "/" },
    }),
  );
});

self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const url = new URL(e.notification.data?.url || "/", self.location.origin);
  url.searchParams.set("utm_source", "push");
  url.searchParams.set("utm_medium", "lembrete");
  e.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      const open = list.find((c) => c.url.startsWith(self.location.origin));
      return open ? open.navigate(url.href).then((c) => c && c.focus()) : self.clients.openWindow(url.href);
    }),
  );
});
