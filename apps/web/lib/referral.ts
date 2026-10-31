"use client";

// Indicação: links compartilhados por quem está logado levam ?ref=<usuario>. Quem chega por eles guarda o ref;
// se criar conta, o AccountSync manda para /api/chips/indicacao e as duas pontas ganham fichas.

const REF_KEY = "mesa.ref";
const ME_KEY = "mesa.me";
/** O ref guardado vale por 30 dias */
const REF_TTL = 30 * 24 * 60 * 60 * 1000;

const valid = (u: string) => /^[a-z0-9_.]{1,40}$/.test(u);

/** Quem chegou por um link com ?ref=: guarda (o primeiro vale) */
export function captureRef() {
  try {
    const ref = new URLSearchParams(location.search).get("ref")?.toLowerCase();
    if (!ref || !valid(ref) || ref === localStorage.getItem(ME_KEY)) return;
    const cur = pendingRef();
    if (!cur) localStorage.setItem(REF_KEY, JSON.stringify({ u: ref, at: Date.now() }));
  } catch {}
}

export function pendingRef(): string | null {
  try {
    const r = JSON.parse(localStorage.getItem(REF_KEY) ?? "null") as { u: string; at: number } | null;
    if (!r || Date.now() - r.at > REF_TTL) return null;
    return r.u;
  } catch {
    return null;
  }
}

export function clearRef() {
  try {
    localStorage.removeItem(REF_KEY);
  } catch {}
}

/** Usuário logado neste aparelho (o AccountSync atualiza); null sem login */
export function setMe(username: string | null) {
  try {
    if (username) localStorage.setItem(ME_KEY, username.toLowerCase());
    else localStorage.removeItem(ME_KEY);
  } catch {}
}

/** O link com ?ref= de quem está logado (sem login, o link fica igual) */
export function withRef(url: string): string {
  try {
    const me = localStorage.getItem(ME_KEY);
    if (!me) return url;
    const u = new URL(url, location.origin);
    u.searchParams.set("ref", me);
    return u.toString();
  } catch {
    return url;
  }
}
