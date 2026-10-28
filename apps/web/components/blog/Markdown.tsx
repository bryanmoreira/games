import Image from "next/image";
import Link from "next/link";
import { Fragment } from "react";
import { IMAGE_RE, type BlogImage } from "@/lib/blog-image-src";

/**
 * Markdown mínimo dos posts: títulos (##, ###), parágrafos, listas (- e 1.), citações (>),
 * imagens sozinhas num bloco (![alt](/blog/x.png "legenda")), **negrito**, *itálico* e [links](/caminho). Sem HTML cru.
 * `image` monta a imagem com o tamanho: `blogImage` no servidor; a prévia do admin passa um que não lê o disco.
 */
export function Markdown({ source, image }: { source: string; image: (src: string, alt: string, caption?: string) => BlogImage }) {
  const blocks = source.split(/\n{2,}/);
  const out: React.ReactNode[] = [];
  blocks.forEach((block, i) => {
    const lines = block.split("\n");
    // Um bloco pode começar com título e seguir com parágrafo na linha de baixo
    while (lines.length && /^#{2,3} /.test(lines[0])) {
      const line = lines.shift()!;
      out.push(
        line.startsWith("### ") ? (
          <h3 key={`${i}h${lines.length}`} className="mt-2 font-display text-base text-white sm:text-lg">
            <Inline text={line.slice(4)} />
          </h3>
        ) : (
          <h2 key={`${i}h${lines.length}`} className="mt-4 font-display text-xl text-gold sm:text-2xl">
            <Inline text={line.slice(3)} />
          </h2>
        ),
      );
    }
    if (!lines.length) return;
    const img = lines.length === 1 && lines[0].match(IMAGE_RE);
    if (img) {
      out.push(<Figure key={i} image={image(img[2], img[1], img[3])} />);
    } else if (lines.every((l) => /^- /.test(l))) {
      out.push(
        <ul key={i} className="flex list-disc flex-col gap-2 pl-5 marker:text-gold">
          {lines.map((l, j) => (
            <li key={j}>
              <Inline text={l.slice(2)} />
            </li>
          ))}
        </ul>,
      );
    } else if (lines.every((l) => /^\d+\. /.test(l))) {
      out.push(
        <ol key={i} className="flex list-decimal flex-col gap-2 pl-6 marker:font-display marker:text-gold">
          {lines.map((l, j) => (
            <li key={j} className="pl-1">
              <Inline text={l.replace(/^\d+\. /, "")} />
            </li>
          ))}
        </ol>,
      );
    } else if (lines.every((l) => l.startsWith(">"))) {
      out.push(
        <blockquote key={i} className="rounded-r-xl border-l-4 border-gold bg-white/5 px-4 py-3 text-white/80">
          <Inline text={lines.map((l) => l.replace(/^>\s?/, "")).join(" ")} />
        </blockquote>,
      );
    } else {
      out.push(
        <p key={i}>
          <Inline text={lines.join(" ")} />
        </p>,
      );
    }
  });
  return <>{out}</>;
}

/** Imagem do post com legenda opcional. Lazy por padrão; a capa usa `eager`. */
export function Figure({ image, eager = false, sizes = "(max-width: 768px) 100vw, 704px" }: { image: BlogImage; eager?: boolean; sizes?: string }) {
  return (
    // Prints de celular (até 800px de largura, em 2×) não ocupam a largura toda no desktop
    <figure className={`flex flex-col gap-2 ${image.width <= 800 ? "mx-auto w-full max-w-sm" : ""}`}>
      <Image
        src={image.src}
        alt={image.alt}
        width={image.width}
        height={image.height}
        sizes={sizes}
        loading={eager ? "eager" : "lazy"}
        fetchPriority={eager ? "high" : undefined}
        className="h-auto w-full rounded-2xl ring-1 ring-white/10"
      />
      {image.caption && <figcaption className="text-center text-sm text-white/55">{image.caption}</figcaption>}
    </figure>
  );
}

function Inline({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\([^)]+\))/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith("**"))
          return (
            <b key={i} className="font-semibold text-white">
              <Inline text={part.slice(2, -2)} />
            </b>
          );
        const link = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
        if (link) {
          const [, label, href] = link;
          const cls = "font-semibold text-gold underline decoration-gold/40 underline-offset-2 hover:decoration-gold";
          return href.startsWith("/") ? (
            <Link key={i} href={href} className={cls}>
              <Inline text={label} />
            </Link>
          ) : (
            <a key={i} href={href} className={cls} target="_blank" rel="noopener noreferrer">
              {label}
            </a>
          );
        }
        if (/^\*[^*]+\*$/.test(part))
          return (
            <i key={i}>
              <Inline text={part.slice(1, -1)} />
            </i>
          );
        return <Fragment key={i}>{part}</Fragment>;
      })}
    </>
  );
}
