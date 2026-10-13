const MINUTE = 60_000;
const DAY = 24 * 60 * MINUTE;
/** Brasília é UTC-3 o ano todo. */
const BRT = 3 * 60 * MINUTE;
/** Folga depois da meia-noite, para o site já estar no dia novo. */
const AFTER_MIDNIGHT = 5_000;

/** ms até a próxima meia-noite de Brasília (mais a folga). */
export function msToMidnight(now = Date.now()): number {
  return DAY - ((((now - BRT) % DAY) + DAY) % DAY) + AFTER_MIDNIGHT;
}
