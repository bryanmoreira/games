import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { blogImage, IMAGE_RE, type BlogImage } from "@/lib/blog-images";
import { getGame } from "@/lib/seo";

/** Posts do blog: arquivos Markdown em `content/blog`, com front matter simples (`chave: valor`). */

export type BlogPost = {
  slug: string;
  title: string;
  description: string;
  /** Slug do jogo em `GAMES`, ou "home" para posts sobre o site todo */
  game: string;
  keyword: string;
  date: string;
  draft: boolean;
  /** Capa (`cover` e `coverAlt` no front matter): topo do post e lista */
  cover?: BlogImage;
  body: string;
};

const DIR = join(/* turbopackIgnore: true */ process.cwd(), "content/blog");

/** Rascunhos aparecem no `next dev` ou com `BLOG_DRAFTS=1`; no build de produção ficam de fora (sem página e sem sitemap). */
export const SHOW_DRAFTS = process.env.NODE_ENV !== "production" || process.env.BLOG_DRAFTS === "1";

function parse(file: string): BlogPost {
  const raw = readFileSync(join(DIR, file), "utf8").replace(/\r\n/g, "\n");
  const m = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!m) throw new Error(`Post sem front matter: ${file}`);
  const meta: Record<string, string> = {};
  for (const line of m[1].split("\n")) {
    const i = line.indexOf(":");
    if (i > 0) meta[line.slice(0, i).trim()] = line.slice(i + 1).trim().replace(/^"(.*)"$/, "$1");
  }
  const body = m[2].trim();
  for (const block of body.split(/\n{2,}/)) {
    const img = block.trim().match(IMAGE_RE);
    if (img && !img[1].trim()) console.warn(`[blog] imagem sem alt em ${file}: ${img[2]}`);
  }
  if (meta.cover && !meta.coverAlt?.trim()) console.warn(`[blog] capa sem coverAlt em ${file}`);
  return {
    cover: meta.cover ? blogImage(meta.cover, meta.coverAlt ?? "") : undefined,
    slug: meta.slug ?? file.replace(/^\d+-|\.md$/g, ""),
    title: meta.title,
    description: meta.description,
    game: meta.game ?? "home",
    keyword: meta.keyword ?? "",
    date: meta.date,
    draft: meta.draft === "true",
    body,
  };
}

let cache: BlogPost[] | null = null;

/** Posts visíveis, do mais novo para o mais antigo (mesma data: ordem do arquivo). */
export function getPosts(): BlogPost[] {
  // No dev relê a cada pedido, para editar o .md e só recarregar a página
  const posts =
    (process.env.NODE_ENV === "production" && cache) ||
    (cache = readdirSync(DIR)
      .filter((f) => f.endsWith(".md"))
      .sort()
      .map(parse));
  return posts.filter((p) => SHOW_DRAFTS || !p.draft).sort((a, b) => b.date.localeCompare(a.date));
}

export function getPost(slug: string): BlogPost | undefined {
  return getPosts().find((p) => p.slug === slug);
}

/** Destino do botão "Jogar agora": a página do jogo, ou a home. */
export function postCta(p: BlogPost): { href: string; label: string; howTo?: string } {
  if (p.game === "home") return { href: "/", label: "Escolher um jogo" };
  const g = getGame(p.game);
  return { href: g.path, label: "Jogar agora", howTo: `${g.path}/como-jogar` };
}

export function formatDate(date: string): string {
  return new Date(`${date}T12:00:00Z`).toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
}
