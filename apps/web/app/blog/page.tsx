import type { Metadata } from "next";
import Link from "next/link";
import { BackButton } from "@/components/BackButton";
import { SiteFooter } from "@/components/SiteFooter";
import { Figure } from "@/components/blog/Markdown";
import { formatDate, getPosts } from "@/lib/blog";
import { getGame, SITE_NAME } from "@/lib/seo";

const TITLE = "Blog: dicas e regras de jogos de cartas e de mesa";
const DESCRIPTION = "Dicas, regras e diferenças entre variantes de Truco, Buraco, Dominó, Damas, Xadrez e outros jogos para jogar online com os amigos.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/blog" },
  openGraph: { title: `${TITLE} · ${SITE_NAME}`, description: DESCRIPTION, url: "/blog", siteName: SITE_NAME, locale: "pt_BR", type: "website" },
};

export default function Blog() {
  const posts = getPosts();
  return (
    <div className="min-h-dvh bg-[#0f1813]">
      <main className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-8 sm:py-12">
        <header className="relative flex flex-col items-center gap-1">
          <BackButton href="/" className="absolute left-0 top-1/2 -translate-y-1/2" />
          <h1 className="font-display text-3xl text-gold sm:text-4xl">BLOG</h1>
          <span className="font-display text-xs tracking-[0.4em] text-white/60">DICAS E REGRAS</span>
        </header>

        {posts.length === 0 && <p className="text-center text-white/60">Nenhum post ainda.</p>}

        <ul className="flex flex-col gap-3">
          {posts.map((p, i) => (
            <li key={p.slug}>
              <Link
                href={`/blog/${p.slug}`}
                className="flex flex-col gap-2 rounded-3xl bg-white/5 p-4 ring-1 ring-white/10 transition hover:bg-white/10 hover:ring-gold/40 sm:p-5"
              >
                {p.cover && <Figure image={p.cover} eager={i === 0} sizes="(max-width: 768px) 100vw, 704px" />}
                <span className="flex flex-wrap items-center gap-2 text-xs text-white/50">
                  <span className="rounded-full bg-gold/15 px-2.5 py-0.5 font-display text-[10px] tracking-wider text-gold">
                    {p.game === "home" ? "MESA DE JOGOS" : getGame(p.game).name.toUpperCase()}
                  </span>
                  {formatDate(p.date)}
                  {p.draft && <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-[10px] font-semibold text-red-300">RASCUNHO</span>}
                </span>
                <h2 className="font-display text-lg leading-tight text-white sm:text-xl">{p.title}</h2>
                <p className="text-sm text-white/70">{p.description}</p>
              </Link>
            </li>
          ))}
        </ul>
      </main>
      <SiteFooter />
    </div>
  );
}
