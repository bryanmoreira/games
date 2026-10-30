// Roda uma vez quando o servidor sobe, ou seja, a cada deploy
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs" || process.env.NODE_ENV !== "production") return;
  const { pingIndexNow, publicPaths } = await import("@/lib/indexnow");
  // espera o site responder: o buscador baixa /indexnow.txt para conferir a chave
  setTimeout(() => void pingIndexNow(publicPaths()), 60_000);
}
