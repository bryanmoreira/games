import { getGame } from "@/lib/seo";

export function JsonLd({ data }: { data: object }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}

/** Frase curta e indexável sob o título da página do jogo */
export function GameIntro({ slug }: { slug: string }) {
  return <p className="-mt-4 max-w-xs text-center text-sm text-white/60">{getGame(slug).tagline}</p>;
}

/** Perguntas frequentes da página "Como jogar": texto que buscadores e IAs conseguem citar */
export function GameFaq({ slug }: { slug: string }) {
  const g = getGame(slug);
  return (
    <section aria-labelledby="faq" className="flex flex-col gap-3">
      <h2 id="faq" className="text-center font-display text-xl text-gold">
        Perguntas frequentes
      </h2>
      <div className="flex flex-col gap-2">
        {g.faq.map((f) => (
          <details key={f.q} className="group rounded-xl bg-black/30 px-4 py-3">
            <summary className="cursor-pointer list-none font-semibold text-white/90 marker:hidden">{f.q}</summary>
            <p className="mt-2 text-sm leading-relaxed text-white/70">{f.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
