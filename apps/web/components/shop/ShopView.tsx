"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChipIcon, GiftIcon } from "@/components/chips/ChipIcon";
import { DeckPreview, backSrc, faceSrc } from "@/components/shop/Art";
import { EarnChips } from "@/components/shop/EarnChips";
import { Inventory } from "@/components/shop/Inventory";
import { TablePreview } from "@/components/shop/TablePreview";
import { XIcon } from "@/components/ui/buttons";
import { ChipAvatar } from "@/components/ui/ChipFrame";
import { WELCOME_CHIPS } from "@/lib/chips-rules";
import { ITEMS, ITEM_BY_ID, TIERS, deckKey, shopAction, type ItemType, type ShopItem } from "@/lib/shop/catalog";
import { buy, equip, type ShopStateJson } from "@/lib/shop/client";
import type { SaleItem } from "@/lib/shop/sale";
import type { Sale } from "@/lib/shop/shop";
import { loginHref } from "@/lib/login";

type User = { name: string; image: string | null };
/** Sem conta: a ficha vazia nas prévias. */
const GUEST: User = { name: "", image: null };

const DATE = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "America/Sao_Paulo" });
const fmt = (n: number) => n.toLocaleString("pt-BR");
const pad = (n: number) => String(n).padStart(2, "0");

const Icon = ({ d, className = "h-5 w-5" }: { d: React.ReactNode; className?: string }) => (
  <svg viewBox="0 0 24 24" className={`shrink-0 ${className}`} fill="none" stroke="currentColor" strokeWidth={2.25} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {d}
  </svg>
);
const CHECK = <path d="m5 12 5 5L20 7" />;
const LOCK = (
  <>
    <rect x="5" y="11" width="14" height="10" rx="2" />
    <path d="M8 11V7a4 4 0 0 1 8 0v4" />
  </>
);
const CLOCK = (
  <>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </>
);
const TAG = (
  <>
    <path d="M3 12V4a1 1 0 0 1 1-1h8l9 9-9 9-9-9Z" />
    <circle cx="7.5" cy="7.5" r="1.5" />
  </>
);
const USER = (
  <>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21a8 8 0 0 1 16 0" />
  </>
);
const CHEVRON = (dir: 1 | -1) => <path d={dir === 1 ? "m9 6 6 6-6 6" : "m15 6-6 6 6 6"} />;

type Tab = "shop" | "earn" | "inv";
const TABS: { type: Tab; label: string; icon: React.ReactNode; logged?: boolean }[] = [
  { type: "shop", label: "Loja", icon: <path d="M3 9l1.5-5h15L21 9M3 9h18M3 9v11h18V9M9 20v-6h6v6" /> },
  {
    type: "earn",
    label: "Ganhar",
    icon: (
      <>
        <path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4Z" />
        <path d="M17 6h3v2a3 3 0 0 1-3 3M7 6H4v2a3 3 0 0 0 3 3" />
      </>
    ),
  },
  {
    type: "inv",
    label: "Meus itens",
    logged: true,
    icon: (
      <>
        <path d="M5 8h14l-1 12H6L5 8Z" />
        <path d="M9 8V6a3 3 0 0 1 6 0v2" />
      </>
    ),
  },
];

const SHELVES: { type: ItemType; label: string }[] = [
  { type: "frame", label: "Molduras" },
  { type: "deck", label: "Baralhos" },
  { type: "table", label: "Mesas" },
];

/** Brilho da raridade atrás da arte (closest-side: some antes de chegar na borda, sem corte). */
const glow = (color: string) => ({ background: `radial-gradient(closest-side, ${color}40, transparent)` });

/** Arte do item no tamanho do card (`big`: a da janela). */
function Art({ it, user, frame, big = false }: { it: ShopItem; user: User; frame?: string | null; big?: boolean }) {
  if (it.type === "frame") return <ChipAvatar user={user} frame={it.key} className={big ? "h-36 w-36 text-5xl" : "h-20 w-20 text-2xl"} />;
  if (it.type === "table") return <TablePreview table={it.key} user={user} frame={frame} scale={big ? 0.84 : 0.36} />;
  return big ? <DeckShow deck={deckKey(it.key)} /> : <DeckPreview deck={it.key} className="h-28" />;
}

function Price({ it, sale, className = "" }: { it: ShopItem; sale?: SaleItem; className?: string }) {
  return (
    <span className={`flex items-center gap-1.5 font-bold tabular-nums ${className}`}>
      <ChipIcon className="h-[1.15em] w-[1.15em]" />
      {sale && <s className="text-[0.8em] font-semibold text-white/35">{fmt(it.price)}</s>}
      <span className={sale ? "text-gold" : ""}>{fmt(sale?.price ?? it.price)}</span>
    </span>
  );
}

/** Tempo até a promoção virar (hh:mm:ss). Quando zera, pede a página de novo para trazer a do dia seguinte. */
function useCountdown(endsAt: number) {
  const router = useRouter();
  const [left, setLeft] = useState<number | null>(null);
  useEffect(() => {
    const tick = () => {
      const ms = endsAt - Date.now();
      setLeft(Math.max(0, ms));
      if (ms <= 0) router.refresh();
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [endsAt, router]);
  if (left === null) return "--:--:--";
  const s = Math.floor(left / 1000);
  return `${pad(Math.floor(s / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`;
}

export function ShopView({
  user,
  initial,
  sale,
  streak,
  unlocked,
}: {
  /** null: sem conta (vitrine) */
  user: User | null;
  initial: ShopStateJson | null;
  sale: Sale;
  streak: number;
  unlocked: string[];
}) {
  const router = useRouter();
  const [state, setState] = useState(initial);
  const [tab, setTab] = useState<Tab>("shop");
  const [open, setOpen] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const me = user ?? GUEST;
  const onSale = new Map(sale.items.map((s) => [s.id, s]));

  // Voltando do login com ?item=…: abre o item que a pessoa queria.
  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get("item");
    if (q && ITEM_BY_ID.has(q)) setOpen(q);
  }, []);

  const owned = (it: ShopItem) => !!state?.items.some((i) => i.itemId === it.id);
  const isEquipped = (it: ShopItem) =>
    !!state && (it.type === "deck" ? deckKey(state.equipped.deck) === it.key : (it.type === "frame" ? state.equipped.frame : state.equipped.table) === it.key);
  const priceOf = (it: ShopItem) => onSale.get(it.id)?.price ?? it.price;
  const actionOf = (it: ShopItem) => (state ? shopAction({ ...it, price: priceOf(it) }, owned(it), isEquipped(it), state.chips) : null);

  const onAction = async (it: ShopItem) => {
    const action = actionOf(it);
    if (action !== "buy" && action !== "equip") return;
    setBusy(true);
    setError(null);
    const r = action === "buy" ? await buy(it.id, priceOf(it)) : await equip(it.type, it.key);
    setBusy(false);
    if (r.state) setState(r.state);
    if (!r.ok) setError(r.error === "price" ? "A promoção mudou. Confira o preço." : r.error === "poor" ? "Fichas insuficientes." : "Não deu certo.");
    router.refresh();
  };

  const tabs = TABS.filter((t) => !t.logged || state);
  const item = open ? ITEM_BY_ID.get(open) : undefined;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-center">
        <div role="tablist" className="flex rounded-2xl bg-black/30 p-1 ring-1 ring-white/10">
          {tabs.map((t) => (
            <button
              key={t.type}
              role="tab"
              aria-selected={tab === t.type}
              onClick={() => setTab(t.type)}
              className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition sm:px-4 ${
                tab === t.type ? "bg-gold text-[#2a1a04] shadow-[0_2px_0_#7a4e0c]" : "text-white/55 hover:text-white"
              }`}
            >
              <Icon className="h-4 w-4" d={t.icon} />
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {tab === "inv" && state && user ? (
        <Inventory user={user} state={state} onChange={setState} />
      ) : tab === "earn" ? (
        <EarnChips logged={!!state} streak={streak} unlocked={unlocked} />
      ) : (
        <>
          <SaleBanner sale={sale} user={me} frame={state?.equipped.frame} owned={owned} onOpen={setOpen} />
          {!state && <GuestStrip />}
          {SHELVES.map((s) => {
            const list = ITEMS.filter((i) => i.type === s.type);
            return (
              <Shelf key={s.type} label={s.label} count={state ? `${list.filter(owned).length}/${list.length}` : null}>
                {list.map((it) => (
                  <ItemCard
                    key={it.id}
                    it={it}
                    sale={onSale.get(it.id)}
                    user={me}
                    frame={state?.equipped.frame}
                    status={isEquipped(it) ? "equipped" : owned(it) ? "owned" : null}
                    onClick={() => setOpen(it.id)}
                  />
                ))}
              </Shelf>
            );
          })}
        </>
      )}

      {item && (
        <ItemModal
          it={item}
          sale={onSale.get(item.id)}
          user={me}
          frame={state?.equipped.frame}
          action={actionOf(item)}
          chips={state?.chips ?? 0}
          got={state?.items.find((i) => i.itemId === item.id)}
          busy={busy}
          error={error}
          onAction={() => void onAction(item)}
          onClose={() => {
            setOpen(null);
            setError(null);
          }}
        />
      )}
    </div>
  );
}

/** Os 4 itens do dia com o desconto e o tempo que falta. */
function SaleBanner({
  sale,
  user,
  frame,
  owned,
  onOpen,
}: {
  sale: Sale;
  user: User;
  frame?: string | null;
  owned: (it: ShopItem) => boolean;
  onOpen: (id: string) => void;
}) {
  const left = useCountdown(sale.endsAt);
  return (
    <section className="relative overflow-hidden rounded-3xl bg-[linear-gradient(135deg,#5a1414_0%,#2a0d0d_45%,#1a120a_100%)] p-4 ring-1 ring-gold/30 sm:p-5">
      <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-gold/10 blur-3xl" aria-hidden="true" />
      <div className="relative flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 font-display text-lg text-gold sm:text-xl">
          <Icon className="h-6 w-6" d={TAG} />
          PROMOÇÃO DO DIA
        </h2>
        <span className="flex items-center gap-2 rounded-full bg-black/40 px-3 py-1.5 font-display text-sm tabular-nums text-white ring-1 ring-white/10" title="Acaba em">
          <Icon className="h-4 w-4 text-gold" d={CLOCK} />
          {left}
        </span>
      </div>
      <ul className="relative mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        {sale.items.map((s) => {
          const it = ITEM_BY_ID.get(s.id);
          if (!it) return null;
          const t = TIERS[it.tier];
          const has = owned(it);
          return (
            <li key={s.id}>
              <button
                onClick={() => onOpen(s.id)}
                className="group relative flex w-full flex-col items-center overflow-hidden rounded-2xl bg-black/35 px-3 pb-3 pt-3 ring-1 ring-white/10 transition hover:-translate-y-0.5 hover:ring-gold/50"
              >
                <span className="absolute left-0 top-3 z-10 rounded-r-full bg-red-500 py-0.5 pl-2 pr-2.5 font-display text-sm text-white shadow-[0_2px_0_#7f1d1d]">
                  -{s.pct}%
                </span>
                <span className="flex h-32 w-full items-center justify-center rounded-xl" style={glow(t.color)}>
                  <Art it={it} user={user} frame={frame} />
                </span>
                <span className="mt-1 text-sm font-semibold">{it.name}</span>
                <span className="mt-0.5 text-[10px] font-bold uppercase tracking-wider" style={{ color: t.color }}>
                  {t.label}
                </span>
                {has ? (
                  <Icon className="mt-1.5 h-5 w-5 text-emerald-300" d={CHECK} />
                ) : (
                  <Price it={it} sale={s} className="mt-1.5 text-base" />
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/** Convite discreto para quem está sem conta. */
function GuestStrip() {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-gold/10 p-3 ring-1 ring-gold/30">
      <ChipIcon className="h-9 w-9 shrink-0" />
      <span className="flex-1 font-display text-sm text-gold sm:text-base">+{WELCOME_CHIPS} FICHAS AO ENTRAR</span>
      <Link
        href={loginHref("/loja")}
        className="flex items-center gap-2 rounded-xl bg-gold px-4 py-2 text-sm font-semibold text-[#2a1a04] shadow-[0_2px_0_#7a4e0c] transition hover:brightness-110"
      >
        <Icon className="h-4 w-4" d={USER} />
        Entrar
      </Link>
    </div>
  );
}

/** Prateleira com rolagem para o lado (setas no computador). */
function Shelf({ label, count, children }: { label: string; count: string | null; children: React.ReactNode }) {
  const ref = useRef<HTMLUListElement>(null);
  const move = (dir: 1 | -1) => ref.current?.scrollBy({ left: dir * ref.current.clientWidth * 0.8, behavior: "smooth" });
  const arrow = "hidden h-8 w-8 items-center justify-center rounded-full bg-white/5 text-white/60 ring-1 ring-white/10 transition hover:bg-white/10 hover:text-white md:flex";
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <h2 className="font-display text-lg text-white/90">{label.toUpperCase()}</h2>
        {count && <span className="text-xs font-semibold tabular-nums text-white/40">{count}</span>}
        <span className="h-px flex-1 bg-gradient-to-r from-white/15 to-transparent" />
        <button onClick={() => move(-1)} aria-label="Voltar" className={arrow}>
          <Icon className="h-4 w-4" d={CHEVRON(-1)} />
        </button>
        <button onClick={() => move(1)} aria-label="Mais" className={arrow}>
          <Icon className="h-4 w-4" d={CHEVRON(1)} />
        </button>
      </div>
      <ul ref={ref} className="-mx-4 -mt-2 flex snap-x scroll-px-4 gap-3 overflow-x-auto px-4 pb-3 pt-3 [scrollbar-width:none] sm:-mx-1 sm:scroll-px-1 sm:px-1 sm:[mask-image:linear-gradient(to_right,black_92%,transparent)] [&::-webkit-scrollbar]:hidden">
        {children}
      </ul>
    </section>
  );
}

function ItemCard({
  it,
  sale,
  user,
  frame,
  status,
  onClick,
}: {
  it: ShopItem;
  sale?: SaleItem;
  user: User;
  frame?: string | null;
  status: "equipped" | "owned" | null;
  onClick: () => void;
}) {
  const t = TIERS[it.tier];
  return (
    <li className="shrink-0 snap-start">
      <button
        onClick={onClick}
        className="relative flex w-36 flex-col items-center rounded-2xl bg-gradient-to-b from-white/[0.07] to-white/[0.02] px-3 pb-3 pt-3 ring-1 ring-white/10 transition hover:-translate-y-1 hover:ring-[var(--r)] sm:w-44"
        style={{ ["--r" as string]: `${t.color}99`, boxShadow: it.tier === "lendaria" ? `0 10px 30px -14px ${t.color}` : undefined }}
      >
        {sale && <span className="absolute left-2 top-2 z-10 rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white">-{sale.pct}%</span>}
        <span className="absolute right-2.5 top-2.5 h-2.5 w-2.5 rotate-45 rounded-[3px]" style={{ background: t.color }} title={t.label} />
        <span className="flex h-28 w-full items-center justify-center rounded-xl" style={glow(t.color)}>
          <Art it={it} user={user} frame={frame} />
        </span>
        <span className="mt-2 text-sm font-semibold">{it.name}</span>
        <span className="mt-1 flex h-5 items-center text-sm">
          {status === "equipped" ? (
            <span className="flex items-center gap-1 text-xs font-semibold text-emerald-300">
              <Icon className="h-4 w-4" d={CHECK} />
              Em uso
            </span>
          ) : status === "owned" ? (
            <Icon className="h-4 w-4 text-white/40" d={CHECK} />
          ) : (
            <Price it={it} sale={sale} />
          )}
        </span>
      </button>
    </li>
  );
}

/** Item grande, com o botão de comprar / usar (sem conta: entrar e voltar para ele). */
function ItemModal({
  it,
  sale,
  user,
  frame,
  action,
  chips,
  got,
  busy,
  error,
  onAction,
  onClose,
}: {
  it: ShopItem;
  sale?: SaleItem;
  user: User;
  frame?: string | null;
  action: ReturnType<typeof shopAction> | null;
  chips: number;
  got?: ShopStateJson["items"][number];
  busy: boolean;
  error: string | null;
  onAction: () => void;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const t = TIERS[it.tier];
  const price = sale?.price ?? it.price;
  const btn = "flex w-full items-center justify-center gap-2 rounded-xl py-3 font-semibold transition disabled:cursor-default";

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center sm:p-6" onClick={onClose} role="dialog" aria-modal="true" aria-label={it.name}>
      <div
        className="relative w-full max-w-sm overflow-hidden rounded-t-3xl bg-[#13201a] ring-1 sm:rounded-3xl"
        style={{ ["--tw-ring-color" as string]: `${t.color}80`, boxShadow: `0 20px 60px -20px ${t.color}` }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label="Fechar"
          className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white/70 ring-1 ring-white/10 transition hover:text-white"
        >
          <XIcon />
        </button>
        {sale && <span className="absolute left-0 top-4 z-10 rounded-r-full bg-red-500 py-1 pl-3 pr-3.5 font-display text-base text-white shadow-[0_2px_0_#7f1d1d]">-{sale.pct}%</span>}
        <div className={`flex h-64 items-center justify-center ${it.type === "table" ? "bg-black/30" : "felt !rounded-none !shadow-[inset_0_0_60px_rgba(0,0,0,0.5)]"}`}>
          <Art it={it} user={user} frame={frame} big />
        </div>
        <div className="flex flex-col gap-4 p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="font-display text-xl">{it.name}</div>
              <span className="mt-1.5 inline-block rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-black" style={{ background: t.color }}>
                {t.label}
              </span>
            </div>
            {!got && <Price it={it} sale={sale} className="text-xl" />}
          </div>
          {got && (
            <div className="flex items-center gap-1.5 text-xs text-white/50" title={got.source === "admin" ? "Presente" : "Comprado"}>
              {got.source === "admin" ? <GiftIcon className="h-3.5 w-3.5" /> : <ChipIcon className="h-3.5 w-3.5" />}
              {DATE.format(new Date(got.acquiredAt))}
              {got.price ? ` · ${fmt(got.price)}` : ""}
            </div>
          )}
          {action === null ? (
            <Link href={loginHref(`/loja?item=${it.id}`)} className={`${btn} bg-gold text-[#2a1a04] shadow-[0_3px_0_#7a4e0c] hover:brightness-110`}>
              <Icon d={USER} />
              Entrar para comprar
            </Link>
          ) : action === "equipped" ? (
            <button disabled className={`${btn} bg-white/5 text-emerald-300`}>
              <Icon d={CHECK} />
              Em uso
            </button>
          ) : action === "equip" ? (
            <button disabled={busy} onClick={onAction} className={`${btn} bg-emerald-400 text-emerald-950 hover:brightness-110`}>
              Usar
            </button>
          ) : action === "buy" ? (
            <button disabled={busy} onClick={onAction} className={`${btn} bg-gold text-[#2a1a04] shadow-[0_3px_0_#7a4e0c] hover:brightness-110`}>
              Comprar
              <ChipIcon className="h-5 w-5" />
              {fmt(price)}
            </button>
          ) : (
            <button disabled className={`${btn} bg-white/5 text-red-300`} title="Fichas insuficientes">
              <Icon d={LOCK} />
              Faltam
              <ChipIcon className="h-5 w-5" />
              {fmt(price - chips)}
            </button>
          )}
          {error && <p className="-mt-2 text-center text-xs text-red-300">{error}</p>}
        </div>
      </div>
    </div>
  );
}

/** Monte virado e três cartas abertas do baralho. */
function DeckShow({ deck }: { deck: ReturnType<typeof deckKey> }) {
  const cards = ["ace_of_spades", "king_of_hearts", "7_of_diamonds"];
  return (
    <div className="relative h-44 w-72 select-none">
      {[0, 1, 2].map((i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img key={i} src={backSrc(deck)} alt="" draggable={false} className="card-deck absolute w-24" style={{ left: 8 + i * 3, top: 22 - i * 3 }} />
      ))}
      {cards.map((c, i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={c}
          src={faceSrc(deck, c)}
          alt=""
          draggable={false}
          className="card-deck absolute w-24 rounded-[7%/5%]"
          style={{ left: 150, top: 18, transform: `rotate(${(i - 1) * 14}deg)`, transformOrigin: "50% 160%" }}
        />
      ))}
    </div>
  );
}
