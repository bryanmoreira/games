import type { Metadata } from "next";
import Link from "next/link";
import { ApiKeys } from "@/components/admin/ApiKeys";
import { CARD, PageTitle, Stat, dateFmt, icon } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin";
import { listAllPosts, listApiKeys } from "@/lib/blog-admin";
import { getGame, SITE_URL } from "@/lib/seo";

export const metadata: Metadata = { title: "Blog" };

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="font-display text-sm text-white/80">{title.toUpperCase()}</h2>
      {children}
    </section>
  );
}

const Code = ({ children }: { children: string }) => (
  <pre className="overflow-x-auto rounded-xl bg-black/30 px-3 py-2.5 font-mono text-[12px] leading-relaxed text-white/80">{children}</pre>
);

export default async function AdminBlog() {
  await requireAdmin("/admin/blog");
  const [posts, keys] = await Promise.all([listAllPosts(), listApiKeys()]);
  const drafts = posts.filter((p) => p.draft).length;
  const api = `${SITE_URL}/api/v1/blog`;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-3">
        <PageTitle>Blog</PageTitle>
        <Link href="/admin/blog/novo" className="flex items-center gap-1.5 rounded-xl bg-gold px-4 py-2 text-sm font-semibold text-[#2a1a04] transition hover:brightness-110">
          {icon(<path d="M12 5v14M5 12h14" />, "h-4 w-4")}
          Novo post
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-2 sm:max-w-md">
        <Stat value={posts.length} label="posts" />
        <Stat value={posts.length - drafts} label="publicados" />
        <Stat value={drafts} label="rascunhos" />
      </div>

      {posts.length ? (
        <ul className="flex flex-col gap-2">
          {posts.map((p) => (
            <li key={p.id}>
              <Link href={`/admin/blog/${p.id}`} className={`${CARD} flex items-center gap-3 p-2.5 pr-4 transition hover:bg-white/[0.06] hover:ring-gold/40`}>
                {p.cover ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.cover} alt="" loading="lazy" className="aspect-[1200/630] w-20 shrink-0 rounded-lg object-cover ring-1 ring-white/10 sm:w-28" />
                ) : (
                  <span className="flex aspect-[1200/630] w-20 shrink-0 items-center justify-center rounded-lg bg-white/5 text-white/20 sm:w-28">
                    {icon(
                      <>
                        <rect x="3" y="4" width="18" height="16" rx="2" />
                        <circle cx="9" cy="10" r="2" />
                        <path d="m21 16-5-5-9 9" />
                      </>,
                      "h-5 w-5",
                    )}
                  </span>
                )}
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <span className="truncate text-sm font-medium text-white/90">{p.title}</span>
                  <span className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-white/45">
                    <span className="text-gold/80">{p.game === "home" ? "Site todo" : getGame(p.game).name}</span>
                    <span className="tabular-nums">{dateFmt.format(new Date(`${p.date}T12:00:00Z`))}</span>
                    {p.draft && <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white/60">Rascunho</span>}
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className={`${CARD} px-4 py-10 text-center text-sm text-white/40`}>Nenhum post ainda.</p>
      )}

      <Section title="Chaves da API">
        <ApiKeys keys={keys.map((k) => ({ ...k, createdAt: k.createdAt.toISOString(), lastUsedAt: k.lastUsedAt?.toISOString() ?? null }))} />

        <details className={`${CARD} group px-4 py-3 text-sm text-white/70`}>
          <summary className="flex cursor-pointer list-none items-center gap-2 text-white/80">
            {icon(<path d="m9 6 6 6-6 6" />, "h-4 w-4 transition group-open:rotate-90")}
            Como usar
          </summary>
          <div className="mt-3 flex flex-col gap-3">
            <p>
              Envie a chave em <code className="text-gold">Authorization: Bearer mj_…</code>. Campos: <code>title</code>, <code>description</code>, <code>body</code> (Markdown) e,
              opcionais, <code>slug</code>, <code>game</code>, <code>keyword</code>, <code>date</code>, <code>draft</code>, <code>cover</code>, <code>coverAlt</code>. Sem{" "}
              <code>draft</code> o post fica como rascunho.
            </p>
            <Code>{`# listar
curl ${api}/posts -H "Authorization: Bearer $CHAVE"

# criar e publicar
curl -X POST ${api}/posts -H "Authorization: Bearer $CHAVE" -H "Content-Type: application/json" \\
  -d '{"title":"…","description":"…","game":"truco-paulista","body":"## …","draft":false}'

# editar só alguns campos (ou publicar: {"draft":false})
curl -X PATCH ${api}/posts/<slug> -H "Authorization: Bearer $CHAVE" -H "Content-Type: application/json" -d '{"title":"…"}'

# apagar
curl -X DELETE ${api}/posts/<slug> -H "Authorization: Bearer $CHAVE"

# enviar imagem (PNG, JPEG ou WebP até 5 MB): volta src e markdown
curl -X POST "${api}/images?alt=Descrição" -H "Authorization: Bearer $CHAVE" -H "Content-Type: image/png" --data-binary @capa.png`}</Code>
          </div>
        </details>
      </Section>
    </div>
  );
}
