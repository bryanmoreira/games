"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PostArticle } from "@/components/blog/PostArticle";
import { parseDbImageSrc, type BlogImage } from "@/lib/blog-image-src";
import type { PostError, PostInput } from "@/lib/blog-rules";
import { slugify } from "@/lib/blog-text";

const icon = (d: React.ReactNode, className = "h-4 w-4") => (
  <svg viewBox="0 0 24 24" className={`shrink-0 ${className}`} fill="none" stroke="currentColor" strokeWidth={2.25} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {d}
  </svg>
);

const IMAGE_ICON = (
  <>
    <rect x="3" y="4" width="18" height="16" rx="2" />
    <circle cx="9" cy="10" r="2" />
    <path d="m21 16-5-5-9 9" />
  </>
);

type Size = { width: number; height: number };

const FIELD_LABEL: Record<PostError["field"], string> = {
  title: "Título",
  slug: "Slug",
  description: "Descrição",
  game: "Jogo",
  keyword: "Palavra-chave",
  date: "Data",
  draft: "Rascunho",
  cover: "Capa",
  coverAlt: "Descrição da capa",
  body: "Texto",
  image: "Imagem",
};

const field = "w-full rounded-xl bg-white/5 px-3 py-2 text-sm text-white outline-none ring-1 ring-white/10 placeholder:text-white/30 focus:ring-gold/60";
const label = "flex flex-col gap-1.5 text-[11px] uppercase tracking-wider text-white/50";
const btn = "flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold transition disabled:opacity-40";
const tool = "flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-white/60 transition hover:bg-white/10 hover:text-white disabled:opacity-40";

async function upload(file: File): Promise<{ src: string } | { error: string }> {
  const form = new FormData();
  form.append("file", file);
  const r = await fetch("/api/admin/blog/images", { method: "POST", body: form }).catch(() => null);
  const j = r ? ((await r.json().catch(() => null)) as { src?: string; error?: string } | null) : null;
  return j?.src ? { src: j.src } : { error: j?.error ?? "Não deu certo." };
}

/** Criar (`id` null) ou editar um post. Salvar volta para a lista só ao criar; editando fica na página. */
export function PostEditor({
  id,
  initial,
  games,
  today,
  sizes = {},
}: {
  id: string | null;
  initial: PostInput;
  games: { slug: string; name: string }[];
  today: string;
  sizes?: Record<string, Size>;
}) {
  const router = useRouter();
  const [p, setP] = useState(initial);
  const [slugTouched, setSlugTouched] = useState(!!id);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<PostError[]>([]);
  const [saved, setSaved] = useState(false);
  const [preview, setPreview] = useState(false);
  // prévia: o tamanho das enviadas vem do nome; o das antigas de `public` vem do servidor (`sizes`)
  const previewImage = (src: string, alt: string, caption?: string): BlogImage => ({ src, alt, caption, ...(parseDbImageSrc(src) ?? sizes[src] ?? { width: 1200, height: 630 }) });
  const body = useRef<HTMLTextAreaElement>(null);
  const coverInput = useRef<HTMLInputElement>(null);
  const imageInput = useRef<HTMLInputElement>(null);

  const set = <K extends keyof PostInput>(k: K, v: PostInput[K]) => {
    setSaved(false);
    setP((cur) => ({ ...cur, [k]: v, ...(k === "title" && !slugTouched ? { slug: slugify(String(v)) } : {}) }));
  };

  /** Troca a seleção do texto (ou insere no cursor) e devolve o foco. */
  const insert = (before: string, after = "", fallback = "") => {
    const el = body.current;
    if (!el) return;
    const { selectionStart: a, selectionEnd: b, value } = el;
    const sel = value.slice(a, b) || fallback;
    const next = value.slice(0, a) + before + sel + after + value.slice(b);
    set("body", next);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(a + before.length, a + before.length + sel.length);
    });
  };

  /** Bloco novo no cursor, com linha em branco antes e depois (é o que separa blocos no Markdown). */
  const block = (text: string) => {
    const el = body.current;
    const at = el?.selectionEnd ?? p.body.length;
    const pre = p.body.slice(0, at).replace(/\s*$/, "");
    const post = p.body.slice(at).replace(/^\s*/, "");
    const start = pre ? pre.length + 2 : 0;
    set("body", `${pre ? `${pre}\n\n` : ""}${text}${post ? `\n\n${post}` : ""}`);
    requestAnimationFrame(() => {
      el?.focus();
      el?.setSelectionRange(start, start + text.length);
    });
  };

  const sendImage = async (file: File | undefined, cover: boolean) => {
    if (!file) return;
    setBusy(true);
    const r = await upload(file);
    setBusy(false);
    if ("error" in r) return setErrors([{ field: "image", message: r.error }]);
    if (cover) set("cover", r.src);
    else block(`![${file.name.replace(/\.\w+$/, "").replace(/[-_]+/g, " ")}](${r.src})`);
  };

  const save = async () => {
    setBusy(true);
    setErrors([]);
    const r = await fetch(id ? `/api/admin/blog/posts/${id}` : "/api/admin/blog/posts", {
      method: id ? "PATCH" : "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(p),
    }).catch(() => null);
    const j = r ? ((await r.json().catch(() => null)) as { id?: string; errors?: PostError[] } | null) : null;
    setBusy(false);
    if (!r?.ok || !j?.id) return setErrors(j?.errors ?? [{ field: "body", message: "Não deu certo." }]);
    setSaved(true);
    if (!id) router.replace(`/admin/blog/${j.id}`);
    router.refresh();
  };

  const remove = async () => {
    if (!id || !confirm("Apagar este post?")) return;
    setBusy(true);
    await fetch(`/api/admin/blog/posts/${id}`, { method: "DELETE" }).catch(() => null);
    router.replace("/admin/blog");
    router.refresh();
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex rounded-full bg-white/5 p-1 ring-1 ring-white/10" role="tablist" aria-label="Modo">
          {([false, true] as const).map((v) => (
            <button
              key={String(v)}
              role="tab"
              aria-selected={preview === v}
              title={v ? "Prévia" : "Editar"}
              onClick={() => setPreview(v)}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs transition ${preview === v ? "bg-gold font-medium text-[#2a1a04]" : "text-white/60 hover:text-white"}`}
            >
              {v
                ? icon(
                    <>
                      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
                      <circle cx="12" cy="12" r="3" />
                    </>,
                    "h-3.5 w-3.5",
                  )
                : icon(<path d="M4 20h4L19 9l-4-4L4 16v4Z" />, "h-3.5 w-3.5")}
              {v ? "Prévia" : "Editar"}
            </button>
          ))}
        </div>
        <div className="flex rounded-full bg-white/5 p-1 ring-1 ring-white/10" role="radiogroup" aria-label="Situação">
          {([true, false] as const).map((d) => (
            <button
              key={String(d)}
              role="radio"
              aria-checked={p.draft === d}
              onClick={() => set("draft", d)}
              className={`rounded-full px-3 py-1 text-xs transition ${p.draft === d ? (d ? "bg-white/15 font-medium text-white" : "bg-emerald-400 font-medium text-emerald-950") : "text-white/60 hover:text-white"}`}
            >
              {d ? "Rascunho" : "Publicado"}
            </button>
          ))}
        </div>
        <div className="ml-auto flex gap-2">
          {id && (
            <Link href={`/blog/${initial.slug}`} target="_blank" title="Ver no site" className={`${btn} bg-white/5 text-white/80 ring-1 ring-white/10 hover:bg-white/10`}>
              {icon(
                <>
                  <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
                  <circle cx="12" cy="12" r="3" />
                </>,
              )}
              <span className="hidden sm:inline">Ver</span>
            </Link>
          )}
          {id && (
            <button disabled={busy} onClick={remove} title="Apagar" aria-label="Apagar" className={`${btn} bg-red-500/15 text-red-300 ring-1 ring-red-400/30 hover:bg-red-500/25`}>
              {icon(<path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14" />)}
            </button>
          )}
          <button disabled={busy} onClick={save} className={`${btn} bg-gold px-5 text-[#2a1a04] hover:brightness-110`}>
            {saved ? icon(<path d="m5 12 5 5 9-9" />) : icon(<path d="M5 3h11l3 3v15H5zM8 3v5h8M8 21v-7h8v7" />)}
            {saved ? "Salvo" : "Salvar"}
          </button>
        </div>
      </div>

      {errors.length > 0 && (
        <ul className="flex flex-col gap-1 rounded-2xl bg-red-500/10 px-4 py-3 text-sm text-red-200 ring-1 ring-red-400/30">
          {errors.map((e, i) => (
            <li key={i}>
              <b className="font-semibold">{FIELD_LABEL[e.field]}:</b> {e.message}
            </li>
          ))}
        </ul>
      )}

      {preview && (
        <div className="-mx-4 bg-[#0f1813] px-4 py-2 sm:mx-0 sm:rounded-3xl sm:p-4">
          <div className="mx-auto max-w-3xl">
            <PostArticle p={{ ...p, title: p.title || "Sem título", cover: p.cover ? previewImage(p.cover, p.coverAlt ?? "") : undefined }} image={previewImage} />
          </div>
        </div>
      )}

      <div hidden={preview} className="flex flex-col gap-4">
        <input
          value={p.title}
          onChange={(e) => set("title", e.target.value)}
          placeholder="Título"
          aria-label="Título"
          maxLength={140}
          className={`${field} py-3 font-display text-lg text-gold`}
        />

        <div className="grid gap-3 sm:grid-cols-2">
          <label className={label}>
            Slug
            <div className="flex items-center rounded-xl bg-white/5 ring-1 ring-white/10 focus-within:ring-gold/60">
              <span className="pl-3 text-sm normal-case tracking-normal text-white/30">/blog/</span>
              <input
                value={p.slug}
                onChange={(e) => {
                  setSlugTouched(true);
                  set("slug", e.target.value.toLowerCase());
                }}
                className="min-w-0 flex-1 bg-transparent py-2 pr-3 text-sm normal-case tracking-normal text-white outline-none"
              />
            </div>
          </label>
          <label className={label}>
            Jogo
            <select value={p.game} onChange={(e) => set("game", e.target.value)} className={`${field} normal-case tracking-normal`}>
              <option value="home">Site todo</option>
              {games.map((g) => (
                <option key={g.slug} value={g.slug}>
                  {g.name}
                </option>
              ))}
            </select>
          </label>
          <label className={label}>
            Data
            <input
              type="date"
              value={p.date}
              max="2100-12-31"
              onChange={(e) => set("date", e.target.value || today)}
              className={`${field} normal-case tracking-normal [color-scheme:dark]`}
            />
          </label>
          <label className={label}>
            Palavra-chave
            <input value={p.keyword} onChange={(e) => set("keyword", e.target.value)} className={`${field} normal-case tracking-normal`} />
          </label>
        </div>

        <label className={label}>
          <span className="flex justify-between">
            Descrição
            <span className={`tabular-nums ${p.description.length > 300 ? "text-red-300" : "text-white/30"}`}>{p.description.length}/300</span>
          </span>
          <textarea value={p.description} onChange={(e) => set("description", e.target.value)} rows={2} className={`${field} resize-y normal-case tracking-normal`} />
        </label>

        <div className={label}>
          Capa
          <div className="flex flex-col gap-2 rounded-2xl bg-white/[0.03] p-3 ring-1 ring-white/10 sm:flex-row sm:items-center">
            {p.cover ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={p.cover} alt="" className="aspect-[1200/630] w-full rounded-xl object-cover ring-1 ring-white/10 sm:w-48" />
            ) : (
              <button
                disabled={busy}
                onClick={() => coverInput.current?.click()}
                className="flex aspect-[1200/630] w-full items-center justify-center rounded-xl border border-dashed border-white/20 text-white/40 transition hover:border-gold/50 hover:text-gold sm:w-48"
                aria-label="Enviar capa"
              >
                {icon(IMAGE_ICON, "h-6 w-6")}
              </button>
            )}
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <input
                value={p.coverAlt ?? ""}
                onChange={(e) => set("coverAlt", e.target.value)}
                placeholder="Descrição da imagem"
                aria-label="Descrição da capa"
                className={`${field} normal-case tracking-normal`}
              />
              {p.cover && (
                <div className="flex gap-2">
                  <button disabled={busy} onClick={() => coverInput.current?.click()} className={`${btn} bg-white/5 text-white/80 ring-1 ring-white/10 hover:bg-white/10`}>
                    {icon(IMAGE_ICON)}
                    Trocar
                  </button>
                  <button
                    disabled={busy}
                    onClick={() => set("cover", null)}
                    title="Tirar capa"
                    aria-label="Tirar capa"
                    className={`${btn} text-white/50 hover:bg-white/5 hover:text-red-300`}
                  >
                    {icon(<path d="M18 6 6 18M6 6l12 12" />)}
                  </button>
                </div>
              )}
            </div>
          </div>
          <input ref={coverInput} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={(e) => (sendImage(e.target.files?.[0], true), (e.target.value = ""))} />
        </div>

        <div className={label}>
          Texto
          <div className="flex flex-col overflow-hidden rounded-2xl bg-white/5 ring-1 ring-white/10 focus-within:ring-gold/60">
            <div className="flex flex-wrap gap-0.5 border-b border-white/10 p-1 normal-case tracking-normal">
              <button className={tool} onClick={() => block("## Subtítulo")} title="Subtítulo" aria-label="Subtítulo">
                <span className="font-display text-xs">H2</span>
              </button>
              <button className={tool} onClick={() => block("### Subtítulo menor")} title="Subtítulo menor" aria-label="Subtítulo menor">
                <span className="font-display text-[10px]">H3</span>
              </button>
              <button className={tool} onClick={() => insert("**", "**", "negrito")} title="Negrito" aria-label="Negrito">
                <b className="text-sm">B</b>
              </button>
              <button className={tool} onClick={() => insert("*", "*", "itálico")} title="Itálico" aria-label="Itálico">
                <i className="font-serif text-sm">I</i>
              </button>
              <button className={tool} onClick={() => insert("[", "](/)", "texto do link")} title="Link" aria-label="Link">
                {icon(<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" />)}
              </button>
              <button className={tool} onClick={() => block("- item\n- item")} title="Lista" aria-label="Lista">
                {icon(<path d="M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01" />)}
              </button>
              <button className={tool} onClick={() => block("1. passo\n2. passo")} title="Lista numerada" aria-label="Lista numerada">
                {icon(<path d="M10 6h10M10 12h10M10 18h10M4 4v4M3 18h3l-3 3h3" />)}
              </button>
              <button className={tool} onClick={() => block("> citação")} title="Citação" aria-label="Citação">
                {icon(<path d="M7 7h4v4c0 3-2 5-4 6M15 7h4v4c0 3-2 5-4 6" />)}
              </button>
              <button className={tool} disabled={busy} onClick={() => imageInput.current?.click()} title="Imagem" aria-label="Imagem">
                {icon(IMAGE_ICON)}
              </button>
            </div>
            <textarea
              ref={body}
              value={p.body}
              onChange={(e) => set("body", e.target.value)}
              rows={22}
              spellCheck
              className="min-h-64 resize-y bg-transparent px-3 py-3 font-mono text-[13px] normal-case leading-relaxed tracking-normal text-white/90 outline-none"
            />
          </div>
          <input ref={imageInput} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={(e) => (sendImage(e.target.files?.[0], false), (e.target.value = ""))} />
        </div>
      </div>
    </div>
  );
}
