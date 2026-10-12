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
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      prompt: "select_account",
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 60, // 60 dias
    cookieCache: { enabled: true, maxAge: 5 * 60 },
  },
  user: {
    additionalFields: {
      // perfil público em /perfil/<username>; o jogador liga/desliga em Perfil > Conta
      profilePublic: { type: "boolean", defaultValue: true, required: false, input: true },
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
