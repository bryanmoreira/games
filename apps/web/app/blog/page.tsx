import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { BackButton } from "@/components/BackButton";
import { SiteFooter } from "@/components/SiteFooter";
import { canSeeDrafts, formatDate, getPosts, type BlogPost } from "@/lib/blog";
import { getGame, SITE_NAME } from "@/lib/seo";

const TITLE = "Blog: dicas e regras de jogos de cartas e de mesa";
const DESCRIPTION = "Dicas, regras e diferenças entre variantes de Truco, Buraco, Dominó, Damas, Xadrez e outros jogos para jogar online com os amigos.";

/** A primeira página tem o destaque + 9 posts; as outras têm 9 (3 por linha). */
const PER_PAGE = 9;
const FIRST_PAGE = PER_PAGE + 1;

type Props = { searchParams: Promise<{ pagina?: string }> };

const pageHref = (n: number) => (n <= 1 ? "/blog" : `/blog?pagina=${n}`);

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const page = Number((await searchParams).pagina) || 1;
  const title = page > 1 ? `${TITLE} (página ${page})` : TITLE;
  return {
    title,
    description: DESCRIPTION,
    alternates: { canonical: pageHref(page) },
    openGraph: { title: `${title} · ${SITE_NAME}`, description: DESCRIPTION, url: pageHref(page), siteName: SITE_NAME, locale: "pt_BR", type: "website" },
  };
}

const gameLabel = (p: BlogPost) => (p.game === "home" ? "MESA DE JOGOS" : getGame(p.game).name.toUpperCase());

function Meta({ p }: { p: BlogPost }) {
  return (
    <span className="flex flex-wrap items-center gap-2 text-xs text-white/50">
      <span className="rounded-full bg-gold/15 px-2.5 py-0.5 font-display text-[10px] tracking-wider text-gold">{gameLabel(p)}</span>
      <time dateTime={p.date}>{formatDate(p.date)}</time>
      {p.draft && <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-[10px] font-semibold text-red-300">RASCUNHO</span>}
    </span>
  );
}

function Cover({ p, className, sizes, eager }: { p: BlogPost; className: string; sizes: string; eager?: boolean }) {
  return (
    <div className={`relative overflow-hidden bg-white/5 ${className}`}>
      {p.cover ? (
        <Image
          src={p.cover.src}
          alt={p.cover.alt}
          fill
          sizes={sizes}
          loading={eager ? "eager" : "lazy"}
          fetchPriority={eager ? "high" : undefined}
          className="object-cover transition duration-500 group-hover:scale-105"
        />
      ) : (
        <div className="grid h-full w-full place-items-center font-display text-sm tracking-widest text-gold/40">{gameLabel(p)}</div>
      )}
    </div>
  );
}

function Featured({ p }: { p: BlogPost }) {
  return (
    <Link
      href={`/blog/${p.slug}`}
      className="group grid overflow-hidden rounded-3xl bg-white/5 ring-1 ring-white/10 transition hover:ring-gold/40 md:grid-cols-5"
    >
      <Cover p={p} className="aspect-video md:col-span-3 md:aspect-auto md:min-h-72" sizes="(max-width: 768px) 100vw, 600px" eager />
      <div className="flex flex-col justify-center gap-3 p-5 sm:p-7 md:col-span-2">
        <Meta p={p} />
        <h2 className="font-display text-2xl leading-tight text-white group-hover:text-gold sm:text-3xl">{p.title}</h2>
        <p className="text-sm text-white/70">{p.description}</p>
        <span className="font-display text-xs tracking-wider text-gold">LER O POST →</span>
      </div>
    </Link>
  );
}

function Card({ p }: { p: BlogPost }) {
  return (
    <Link
      href={`/blog/${p.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-3xl bg-white/5 ring-1 ring-white/10 transition hover:bg-white/10 hover:ring-gold/40"
    >
      <Cover p={p} className="aspect-video" sizes="(max-width: 640px) 100vw, 330px" />
      <div className="flex flex-1 flex-col gap-2 p-4 sm:p-5">
        <Meta p={p} />
        <h2 className="font-display text-lg leading-tight text-white group-hover:text-gold">{p.title}</h2>
        <p className="line-clamp-3 text-sm text-white/70">{p.description}</p>
      </div>
    </Link>
  );
}

function Pagination({ page, pages }: { page: number; pages: number }) {
  if (pages <= 1) return null;
  const items = Array.from({ length: pages }, (_, i) => i + 1).filter((n) => n === 1 || n === pages || Math.abs(n - page) <= 1);
  const base = "grid h-10 min-w-10 place-items-center rounded-full px-3 font-display text-sm ring-1 transition";
  return (
    <nav aria-label="Paginação" className="flex flex-wrap items-center justify-center gap-2 pt-2">
      {page > 1 ? (
        <Link href={pageHref(page - 1)} rel="prev" className={`${base} bg-white/5 text-white ring-white/10 hover:ring-gold/40`}>
          ← Anterior
        </Link>
      ) : (
        <span className={`${base} text-white/25 ring-white/5`}>← Anterior</span>
      )}
      {items.map((n, i) => (
        <span key={n} className="flex items-center gap-2">
          {i > 0 && n - items[i - 1] > 1 && <span className="text-white/40">…</span>}
          {n === page ? (
            <span aria-current="page" className={`${base} bg-gold text-black ring-gold`}>
              {n}
            </span>
          ) : (
            <Link href={pageHref(n)} className={`${base} bg-white/5 text-white ring-white/10 hover:ring-gold/40`}>
              {n}
            </Link>
          )}
        </span>
      ))}
      {page < pages ? (
        <Link href={pageHref(page + 1)} rel="next" className={`${base} bg-white/5 text-white ring-white/10 hover:ring-gold/40`}>
          Próxima →
        </Link>
      ) : (
        <span className={`${base} text-white/25 ring-white/5`}>Próxima →</span>
      )}
    </nav>
  );
}

export default async function Blog({ searchParams }: Props) {
  const raw = (await searchParams).pagina;
  const posts = await getPosts(await canSeeDrafts());

  const pages = Math.max(1, 1 + Math.ceil(Math.max(0, posts.length - FIRST_PAGE) / PER_PAGE));
  const page = raw === undefined ? 1 : Number(raw);
  if (!Number.isInteger(page) || page < 1) redirect("/blog");
  if (page > pages) notFound();

  const start = page === 1 ? 0 : FIRST_PAGE + (page - 2) * PER_PAGE;
  const shown = posts.slice(start, page === 1 ? FIRST_PAGE : start + PER_PAGE);
  const featured = page === 1 ? shown[0] : undefined;
  const rest = featured ? shown.slice(1) : shown;

  return (
    <div className="min-h-dvh bg-[#0f1813]">
      <main className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-8 sm:py-12">
        <header className="relative flex flex-col items-center gap-1">
          <BackButton href="/" className="absolute left-0 top-1/2 -translate-y-1/2" />
          <h1 className="font-display text-3xl text-gold sm:text-4xl">BLOG</h1>
          <span className="font-display text-xs tracking-[0.4em] text-white/60">DICAS E REGRAS</span>
        </header>

        {posts.length === 0 && <p className="text-center text-white/60">Nenhum post ainda.</p>}

        {featured && <Featured p={featured} />}

        {rest.length > 0 && (
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {rest.map((p) => (
              <li key={p.slug}>
                <Card p={p} />
              </li>
            ))}
          </ul>
        )}

        <Pagination page={page} pages={pages} />
      </main>
      <SiteFooter />
    </div>
  );
}
