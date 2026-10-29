import Link from "next/link";
import { Figure, Markdown } from "@/components/blog/Markdown";
import type { BlogImage } from "@/lib/blog-image-src";
import { formatDate, readingMinutes } from "@/lib/blog-text";

type ImageFn = (src: string, alt: string, caption?: string) => BlogImage;

type Props = {
  p: { title: string; date: string; draft: boolean; cover?: BlogImage; body: string; description?: string };
  image: ImageFn;
  /** Nome do jogo do post, em chip acima do título */
  category?: string;
};

/** Corpo do post: categoria, título, resumo, data, capa e texto. A página do post e a prévia do admin usam o mesmo, para a prévia ser fiel. */
export function PostArticle({ p, image, category }: Props) {
  return (
    <article className="flex flex-col gap-8">
      <header className="flex flex-col gap-4">
        <nav aria-label="Navegação" className="flex flex-wrap items-center gap-2 text-xs text-white/50">
          <Link href="/blog" className="hover:text-white">
            Blog
          </Link>
          {category && (
            <>
              <span aria-hidden>/</span>
              <span className="rounded-full bg-gold/15 px-2.5 py-0.5 font-display text-[10px] tracking-wider text-gold">{category.toUpperCase()}</span>
            </>
          )}
        </nav>
        <h1 className="font-display text-3xl leading-tight text-white sm:text-5xl">{p.title}</h1>
        {p.description && <p className="text-lg leading-relaxed text-white/70 sm:text-xl">{p.description}</p>}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-y border-white/10 py-3 text-sm text-white/55">
          <span className="font-semibold text-white/80">Mesa de Jogos</span>
          <span aria-hidden>·</span>
          <time dateTime={p.date}>{formatDate(p.date)}</time>
          <span aria-hidden>·</span>
          <span>{readingMinutes(p.body)} min de leitura</span>
          {p.draft && <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-[10px] font-semibold text-red-300">RASCUNHO</span>}
        </div>
      </header>
      {p.cover && <Figure image={p.cover} eager sizes="(max-width: 768px) 100vw, 768px" />}
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 text-lg leading-[1.8] text-white/85 sm:text-[19px]">
        <Markdown source={p.body} image={image} />
      </div>
    </article>
  );
}
