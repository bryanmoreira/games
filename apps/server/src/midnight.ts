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

/** ms até a próxima vez que der `hour` horas em Brasília (0 a 23). */
export function msToHour(hour: number, now = Date.now()): number {
  const sinceMidnight = (((now - BRT) % DAY) + DAY) % DAY;
  const target = hour * 60 * MINUTE;
  return target > sinceMidnight ? target - sinceMidnight : DAY - sinceMidnight + target;
}
