// Eventos do Umami (o script carrega no layout). Sem o script (dev, bloqueador), não faz nada.
// Botões simples usam data-umami-event direto no HTML; isto é para o que acontece no código.

type EventData = Record<string, string | number | boolean>;
type Umami = { track: (name: string, data?: EventData) => void };

export function track(name: string, data?: EventData) {
  if (typeof window === "undefined") return;
  try {
    (window as unknown as { umami?: Umami }).umami?.track(name, data);
  } catch {}
}
