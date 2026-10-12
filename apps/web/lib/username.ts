/** Regras do nome de usuário (perfil público em /perfil/<username>). Vale no cliente e no servidor. */
export const USERNAME_MIN = 3;
export const USERNAME_MAX = 20;
export const USERNAME_RE = /^[a-z0-9_]+$/;

// rotas e palavras que não podem virar perfil
const RESERVED = new Set(["conta", "conquistas", "amigos", "editar", "config", "configuracoes", "admin", "api", "login", "entrar", "sair", "perfil", "jogador", "suporte", "mesadejogos"]);

export function normalizeUsername(u: string): string {
  return u.trim().toLowerCase();
}

export type UsernameProblem = "short" | "long" | "chars" | "reserved";

export function usernameProblem(raw: string): UsernameProblem | null {
  const u = normalizeUsername(raw);
  if (u.length < USERNAME_MIN) return "short";
  if (u.length > USERNAME_MAX) return "long";
  if (!USERNAME_RE.test(u)) return "chars";
  if (RESERVED.has(u)) return "reserved";
  return null;
}

export const USERNAME_HINT: Record<UsernameProblem, string> = {
  short: `Mínimo de ${USERNAME_MIN} caracteres`,
  long: `Máximo de ${USERNAME_MAX} caracteres`,
  chars: "Só letras, números e _",
  reserved: "Nome reservado",
};

/** Base de username a partir do nome ou e-mail: "João Silva" → "joaosilva". */
export function usernameBase(name: string, email: string): string {
  const clean = (s: string) =>
    s
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, "");
  let base = clean(name);
  if (base.length < USERNAME_MIN) base = clean(email.split("@")[0] ?? "");
  if (base.length < USERNAME_MIN) base = "jogador";
  return base.slice(0, USERNAME_MAX - 4);
}
