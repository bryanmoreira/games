import { Figure, Markdown } from "@/components/blog/Markdown";
import type { BlogImage } from "@/lib/blog-image-src";
import { formatDate } from "@/lib/blog-text";

type ImageFn = (src: string, alt: string, caption?: string) => BlogImage;

/** Corpo do post: capa, data, título e texto. A página do post e a prévia do admin usam o mesmo, para a prévia ser fiel. */
export function PostArticle({ p, image }: { p: { title: string; date: string; draft: boolean; cover?: BlogImage; body: string }; image: ImageFn }) {
  return (
    <article className="flex flex-col gap-5 rounded-3xl bg-white/5 p-5 leading-relaxed text-white/85 ring-1 ring-white/10 sm:p-8 sm:text-lg">
      {p.cover && <Figure image={p.cover} eager />}
      <div className="flex flex-col gap-2">
        <span className="flex flex-wrap items-center gap-2 text-xs text-white/50 sm:text-sm">
          {formatDate(p.date)}
          {p.draft && <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-[10px] font-semibold text-red-300">RASCUNHO</span>}
        </span>
        <h1 className="font-display text-2xl leading-tight text-gold sm:text-4xl">{p.title}</h1>
      </div>
      <Markdown source={p.body} image={image} />
    </article>
  );
}
