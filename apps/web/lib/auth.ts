import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { username } from "better-auth/plugins";
import { prisma } from "@/lib/db";
import { LOGIN_PATH } from "@/lib/login";
import { USERNAME_MAX, USERNAME_MIN, usernameBase, usernameProblem } from "@/lib/username";

/** Primeiro username livre a partir do nome: joaosilva, joaosilva2, joaosilva7381… */
async function freeUsername(name: string, email: string): Promise<string> {
  const base = usernameBase(name, email);
  const candidates = [base, ...[2, 3, 4, 5].map((n) => `${base}${n}`), ...Array.from({ length: 5 }, () => `${base}${Math.floor(1000 + Math.random() * 9000)}`)];
  for (const c of candidates) {
    if (usernameProblem(c)) continue;
    if (!(await prisma.user.findUnique({ where: { username: c }, select: { id: true } }))) return c;
  }
  return `jogador${crypto.randomUUID().replace(/-/g, "").slice(0, 10)}`;
}

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET,
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  // Atrás do proxy do Easypanel o x-forwarded-for traz uma cadeia ("cliente, proxy"); sem trustedProxies
  // o Better Auth recusa cadeias e o rate limit cai num balde único. Pula os saltos de rede interna.
  advanced: {
    ipAddress: {
      ipAddressHeaders: ["x-forwarded-for", "x-real-ip"],
      trustedProxies: ["10.0.0.0/8", "172.16.0.0/12", "192.168.0.0/16", "127.0.0.1", "::1", "fc00::/7"],
    },
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      prompt: "select_account",
    },
    discord: {
      clientId: process.env.DISCORD_CLIENT_ID ?? "",
      clientSecret: process.env.DISCORD_CLIENT_SECRET ?? "",
    },
  },
  // Login: mesmo e-mail em Google e Discord = mesma conta (só junta se o provedor confirmou o e-mail).
  // "Conectar" em Perfil > Conta liga outro provedor à conta logada, mesmo com e-mail diferente.
  account: { accountLinking: { enabled: true, trustedProviders: ["google"], allowDifferentEmails: true } },
  session: {
    expiresIn: 60 * 60 * 24 * 60, // 60 dias
    cookieCache: { enabled: true, maxAge: 5 * 60 },
  },
  user: {
    // Perfil > Conta > Excluir conta. Sem senha (só login social): o Better Auth exige sessão criada há menos de
    // um dia (session.freshAge); mais velha, o jogador entra de novo. Partidas, conquistas e amigos vão em cascata.
    deleteUser: { enabled: true },
    additionalFields: {
      // perfil público em /perfil/<username>; o jogador liga/desliga em Perfil > Conta
      profilePublic: { type: "boolean", defaultValue: true, required: false, input: true },
      // user | admin; o jogador não muda (input: false). Promover: bun run admin <email>
      role: { type: "string", defaultValue: "user", required: false, input: false },
      // loja: moldura, baralho e mesa do perfil em uso (só mudam por /api/shop, que confere se o jogador tem)
      equippedFrame: { type: "string", required: false, input: false },
      equippedDeck: { type: "string", required: false, input: false },
      equippedTable: { type: "string", required: false, input: false },
    },
  },
  // toda conta nova já nasce com um username (o jogador pode trocar em Perfil > Conta)
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          if ((user as { username?: string }).username) return;
          return { data: { ...user, username: await freeUsername(user.name, user.email) } };
        },
      },
    },
  },
  // erros de login (ex.: state_mismatch) voltam para a tela de login com ?error=
  onAPIError: { errorURL: LOGIN_PATH },
  plugins: [
    username({
      minUsernameLength: USERNAME_MIN,
      maxUsernameLength: USERNAME_MAX,
      usernameValidator: (u) => usernameProblem(u) === null,
      validationOrder: { username: "post-normalization" },
    }),
    nextCookies(),
  ],
});

export type Session = typeof auth.$Infer.Session;
