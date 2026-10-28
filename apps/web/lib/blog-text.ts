// Textos do blog sem dependências: o editor do admin usa no navegador.

/** "Buraco ou Canastra?" → "buraco-ou-canastra" */
export function slugify(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/, "");
}

/** "24 de outubro de 2026" de um AAAA-MM-DD. */
export function formatDate(date: string): string {
  return new Date(`${date}T12:00:00Z`).toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
}
