"use client";

import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { MARK_BG } from "@/components/verbete/Tile";
import { EMPTY_FILTER, isEmpty, search, type Filter } from "@/lib/palavras";

const STEP = 120;

/** Lê o filtro do endereço: ?p=a___o&tem=r&sem=xyz (as páginas fixas mandam para cá já preenchido) */
function fromUrl(): Filter | null {
  const q = new URLSearchParams(window.location.search);
  if (!q.has("p") && !q.has("tem") && !q.has("sem")) return null;
  const p = (q.get("p") ?? "").padEnd(5, "_").slice(0, 5);
  return { pos: [...p].map((c) => (c === "_" ? "" : c)), has: q.get("tem") ?? "", not: q.get("sem") ?? "" };
}

function Words({ words, title }: { words: string[]; title?: string }) {
  const [shown, setShown] = useState(STEP);
  useEffect(() => setShown(STEP), [words]);
  if (!words.length) return null;
  return (
    <div className="flex flex-col gap-3">
      {title && <h3 className="text-center font-display text-sm tracking-[0.2em] text-white/50">{title}</h3>}
      <ul className="flex flex-wrap justify-center gap-1.5">
        {words.slice(0, shown).map((w) => (
          <li key={w} className="rounded-lg bg-white/5 px-2.5 py-1 font-semibold uppercase tracking-wide text-white/90 ring-1 ring-white/10">
            {w}
          </li>
        ))}
      </ul>
      {words.length > shown && (
        <button onClick={() => setShown((s) => s + STEP * 2)} className="mx-auto rounded-full bg-white/10 px-5 py-2 font-display text-xs text-white/80 transition hover:bg-white/20">
          Ver mais {words.length - shown}
        </button>
      )}
    </div>
  );
}

function Swatch({ color }: { color: string }) {
  return <span aria-hidden="true" className="h-4 w-4 shrink-0 rounded" style={{ backgroundColor: color }} />;
}

/** Busca de palavras de 5 letras: letra em cada casa, letras que tem e letras que não tem. */
export function Finder() {
  const [f, setF] = useState<Filter>(EMPTY_FILTER);
  const boxes = useRef<(HTMLInputElement | null)[]>([]);
  useEffect(() => {
    const u = fromUrl();
    if (u) setF(u);
  }, []);

  const deferred = useDeferredValue(f);
  const res = useMemo(() => (isEmpty(deferred) ? null : search(deferred)), [deferred]);

  const setPos = (i: number, v: string) => {
    const c = v.replace(/[^a-zA-ZÀ-ÿ]/g, "").slice(-1);
    setF((x) => ({ ...x, pos: x.pos.map((p, j) => (j === i ? c : p)) }));
    if (c && i < 4) boxes.current[i + 1]?.focus();
  };

  const input = "h-12 w-full rounded-xl bg-black/30 px-4 text-lg font-semibold uppercase tracking-widest text-white outline-none ring-1 ring-white/15 placeholder:normal-case placeholder:tracking-normal placeholder:text-white/30 focus:ring-gold/60";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 rounded-2xl bg-black/20 p-4 ring-1 ring-white/10 sm:p-5">
        <label className="flex flex-col gap-2">
          <span className="flex items-center gap-2 text-sm text-white/70">
            <Swatch color={MARK_BG.right} /> Letra no lugar certo
          </span>
          <span className="grid grid-cols-5 gap-2">
            {f.pos.map((p, i) => (
              <input
                key={i}
                ref={(el) => {
                  boxes.current[i] = el;
                }}
                value={p}
                onChange={(e) => setPos(i, e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Backspace" && !p && i > 0) boxes.current[i - 1]?.focus();
                }}
                aria-label={`Letra ${i + 1}`}
                inputMode="text"
                autoCapitalize="characters"
                autoComplete="off"
                className="aspect-square w-full rounded-xl border-2 bg-white/[0.04] text-center font-display text-2xl uppercase text-white outline-none transition focus:border-gold/70"
                style={p ? { backgroundColor: MARK_BG.right, borderColor: MARK_BG.right } : { borderColor: "rgba(255,255,255,0.15)" }}
              />
            ))}
          </span>
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-2">
            <span className="flex items-center gap-2 text-sm text-white/70">
              <Swatch color={MARK_BG.place} /> Tem as letras
            </span>
            <input value={f.has} onChange={(e) => setF((x) => ({ ...x, has: e.target.value }))} placeholder="ex.: ra" autoComplete="off" className={input} />
          </label>
          <label className="flex flex-col gap-2">
            <span className="flex items-center gap-2 text-sm text-white/70">
              <Swatch color={MARK_BG.absent} /> Não tem as letras
            </span>
            <input value={f.not} onChange={(e) => setF((x) => ({ ...x, not: e.target.value }))} placeholder="ex.: eiu" autoComplete="off" className={input} />
          </label>
        </div>
        {!isEmpty(f) && (
          <button onClick={() => setF(EMPTY_FILTER)} className="mx-auto flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm text-white/60 transition hover:text-white">
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.25} strokeLinecap="round" aria-hidden="true">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
            Limpar
          </button>
        )}
      </div>

      {res && (
        <section aria-live="polite" className="flex flex-col gap-5">
          <p className="text-center font-display text-lg text-gold">
            {res.common.length + res.other.length === 0
              ? "Nenhuma palavra"
              : `${(res.common.length + res.other.length).toLocaleString("pt-BR")} ${res.common.length + res.other.length === 1 ? "palavra" : "palavras"}`}
          </p>
          <Words words={res.common} title={res.other.length ? "MAIS COMUNS" : undefined} />
          <Words words={res.other} title={res.common.length ? "MENOS COMUNS" : undefined} />
        </section>
      )}
    </div>
  );
}
