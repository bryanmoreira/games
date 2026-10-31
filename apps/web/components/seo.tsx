import Link from "next/link";
import { getGame } from "@/lib/seo";
import { HOWTO_UPDATED, howToExtra } from "@/lib/como-jogar";
import { termPath, termsOf } from "@/lib/glossario";

export function JsonLd({ data }: { data: object }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}

/** Frase curta e indexável sob o título da página do jogo */
export function GameIntro({ slug }: { slug: string }) {
  return <p className="-mt-4 max-w-xs text-center text-sm text-white/60">{getGame(slug).tagline}</p>;
}

/** Perguntas frequentes da página "Como jogar": texto que buscadores e IAs conseguem citar */
export function GameFaq({ slug, items, full }: { slug?: string; items?: { q: string; a: string }[]; full?: boolean }) {
  // `full`: com as perguntas a mais do "Como jogar" (a página do jogo mostra só as principais)
  const faq = items ?? [...getGame(slug!).faq, ...(full ? (howToExtra(slug!)?.faq ?? []) : [])];
  return (
    <section aria-labelledby="faq" className="flex flex-col gap-3">
      <h2 id="faq" className="text-center font-display text-xl text-gold">
        Perguntas frequentes
      </h2>
      <div className="flex flex-col gap-2">
        {faq.map((f) => (
          <details key={f.q} className="group rounded-xl bg-black/30 px-4 py-3">
            <summary className="cursor-pointer list-none font-semibold text-white/90 marker:hidden">{f.q}</summary>
            <p className="mt-2 text-sm leading-relaxed text-white/70">{f.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

const fmtDate = (d: string) => new Date(`${d}T12:00:00`).toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" });

/** Resposta curta no topo do "Como jogar": o trecho que o Google e as IAs costumam citar */
export function QuickAnswer({ slug }: { slug: string }) {
  const x = howToExtra(slug);
  if (!x) return null;
  return (
    <section aria-labelledby="resposta" className="flex flex-col gap-2 rounded-2xl bg-black/30 p-4 ring-1 ring-gold/30 sm:p-5">
      <h2 id="resposta" className="font-display text-sm tracking-[0.2em] text-gold">
        RESPOSTA RÁPIDA
      </h2>
      <p className="leading-relaxed text-white/85">{x.answer}</p>
      <p className="text-xs text-white/40">
        Atualizado em <time dateTime={HOWTO_UPDATED}>{fmtDate(HOWTO_UPDATED)}</time>
      </p>
    </section>
  );
}

/** Termos do jogo com página no glossário */
export function GameTerms({ slug }: { slug: string }) {
  const terms = termsOf(slug);
  if (!terms.length) return null;
  return (
    <section aria-labelledby="termos" className="flex flex-col gap-3">
      <h2 id="termos" className="text-center font-display text-xl text-gold">
        Termos do jogo
      </h2>
      <ul className="flex flex-wrap justify-center gap-2">
        {terms.map((t) => (
          <li key={t.slug}>
            <Link href={termPath(t.slug)} className="rounded-full bg-black/30 px-3 py-1.5 text-sm text-white/80 ring-1 ring-white/10 transition hover:text-gold">
              {t.term}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
