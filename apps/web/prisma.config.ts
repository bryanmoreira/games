import { defineConfig } from "prisma/config";

// Carrega o .env quando existir (em produção as variáveis já vêm do ambiente)
try {
  process.loadEnvFile();
} catch {}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations" },
  // Sem DATABASE_URL o generate ainda funciona (só migrate precisa do banco)
  datasource: { url: process.env.DATABASE_URL ?? "" },
});
