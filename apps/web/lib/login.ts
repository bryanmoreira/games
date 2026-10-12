export const LOGIN_PATH = "/login";

/** Só aceita caminhos internos (evita redirecionar para outro site). */
export function safeNext(next: string | null | undefined): string {
  return next && next.startsWith("/") && !next.startsWith("//") && !next.startsWith(LOGIN_PATH) ? next : "/";
}

/** Link para a tela de login que volta para `next` depois. */
export function loginHref(next: string) {
  const n = safeNext(next);
  return n === "/" ? LOGIN_PATH : `${LOGIN_PATH}?next=${encodeURIComponent(n)}`;
}
