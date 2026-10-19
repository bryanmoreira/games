"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChipIcon, GiftIcon } from "@/components/chips/ChipIcon";
import { DeckPreview, backSrc, faceSrc } from "@/components/shop/Art";
import { ChipAvatar } from "@/components/ui/ChipFrame";
import { Inventory } from "@/components/shop/Inventory";
import { DEFAULT_DECK, DEFAULT_NAMES, ITEMS, TIERS, deckKey, shopAction, type ItemType, type ShopItem } from "@/lib/shop/catalog";
import { buy, equip, type ShopStateJson } from "@/lib/shop/client";

/** Item da vitrine; o padrão (ficha vermelha / clássico) tem key null no lugar da moldura. */
type Entry = ShopItem & { def: boolean };
const DEFAULT_ENTRY = (type: ItemType): Entry => ({ id: `${type}:padrao`, type, key: type === "deck" ? DEFAULT_DECK : "", name: DEFAULT_NAMES[type], tier: "comum", price: 0, def: true });
const ENTRIES: Record<ItemType, Entry[]> = {
  frame: [DEFAULT_ENTRY("frame"), ...ITEMS.filter((i) => i.type === "frame").map((i) => ({ ...i, def: false }))],
  deck: [DEFAULT_ENTRY("deck"), ...ITEMS.filter((i) => i.type === "deck").map((i) => ({ ...i, def: false }))],
};

const DATE = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "America/Sao_Paulo" });
const fmt = (n: number) => n.toLocaleString("pt-BR");

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
type Tab = ItemType | "inv";
const TABS: { type: Tab; label: string; icon: React.ReactNode }[] = [
  {
    type: "frame",
    label: "Molduras",
    icon: (
      <>
        <circle cx="12" cy="12" r="9" />
        <circle cx="12" cy="10" r="3" />
        <path d="M6.5 18.5c1.2-2.3 3-3.5 5.5-3.5s4.3 1.2 5.5 3.5" />
      </>
    ),
  },
  {
    type: "deck",
    label: "Baralhos",
    icon: (
      <>
        <rect x="3" y="5" width="11" height="15" rx="2" transform="rotate(-10 8.5 12.5)" />
        <rect x="10" y="4" width="11" height="15" rx="2" transform="rotate(8 15.5 11.5)" />
      </>
    ),
  },
  {
    type: "inv",
    label: "Inventário",
    icon: (
      <>
        <path d="M5 8h14l-1 12H6L5 8Z" />
        <path d="M9 8V6a3 3 0 0 1 6 0v2" />
      </>
    ),
  },
];

export function ShopView({ user, initial }: { user: { name: string; image: string | null }; initial: ShopStateJson }) {
  const router = useRouter();
  const [state, setState] = useState(initial);
  const [tab, setTab] = useState<Tab>("frame");
  const shopTab: ItemType = tab === "inv" ? "frame" : tab;
  const [sel, setSel] = useState<Record<ItemType, string>>({ frame: "frame:ficha", deck: "deck:noite" });
  const [busy, setBusy] = useState(false);

  const owned = (e: Entry) => e.def || !!state?.items.some((i) => i.itemId === e.id);
  const isEquipped = (e: Entry) =>
    !!state && (e.type === "frame" ? (state.equipped.frame ?? "") === (e.def ? "" : e.key) : deckKey(state.equipped.deck) === e.key);
  const entry = ENTRIES[shopTab].find((e) => e.id === sel[shopTab]) ?? ENTRIES[shopTab][0];
  const action = state ? shopAction(entry, owned(entry), isEquipped(entry), state.chips) : null;
  const got = state?.items.find((i) => i.itemId === entry.id);

  const run = async (fn: () => ReturnType<typeof buy>) => {
    setBusy(true);
    const r = await fn();
    setBusy(false);
    if (r.state) setState(r.state);
    router.refresh();
  };
  const onAction = () => {
    if (action === "buy") void run(() => buy(entry.id));
    else if (action === "equip") void run(() => equip(entry.type, entry.def ? null : entry.key));
  };

  const tier = TIERS[entry.tier];
  const btn = "mt-4 flex w-full items-center justify-center gap-2 rounded-xl py-3 font-semibold transition disabled:cursor-default";

  return (
    <div className="flex flex-col gap-5">
      <h1 className="flex items-center gap-3 font-display text-3xl text-gold drop-shadow-[0_2px_0_#7a4e0c] sm:text-4xl">
        <Icon className="h-8 w-8" d={<path d="M3 9l1.5-5h15L21 9M3 9h18M3 9v11h18V9M9 20v-6h6v6" />} />
        LOJA
      </h1>

      <div role="tablist" className="flex gap-2">
        {TABS.map((t) => (
          <button
            key={t.type}
            role="tab"
            aria-selected={tab === t.type}
            onClick={() => setTab(t.type)}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold ring-1 transition ${
              tab === t.type ? "bg-gold text-[#2a1a04] ring-gold" : "bg-white/5 text-white/60 ring-white/10 hover:bg-white/10 hover:text-white"
            }`}
          >
            <Icon d={t.icon} />
            {t.label}
          </button>
        ))}
      </div>

      {tab === "inv" ? (
        <Inventory user={user} state={state} onChange={setState} />
      ) : (
        <div className="flex flex-col gap-5 md:grid md:grid-cols-[1fr_320px] md:items-start">
          {/* destaque (no celular vem primeiro) */}
          <aside className="overflow-hidden rounded-3xl bg-white/5 ring-1 ring-white/10 md:sticky md:top-20 md:order-2" style={{ ["--r" as string]: tier.color }}>
            <div className="felt flex h-60 items-center justify-center !rounded-none !shadow-[inset_0_0_60px_rgba(0,0,0,0.5)]">
              {shopTab === "frame" ? (
                <ChipAvatar user={user} frame={entry.def ? null : entry.key} className="h-32 w-32 text-5xl" />
              ) : (
                <DeckShow deck={deckKey(entry.key)} />
              )}
            </div>
            <div className="p-4">
              <div className="font-display text-lg">{entry.name}</div>
              <span className="mt-1.5 inline-block rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-black" style={{ background: tier.color }}>
                {tier.label}
              </span>
              {got && (
                <div className="mt-2 flex items-center gap-1.5 text-xs text-white/50" title={got.source === "admin" ? "Presente" : "Comprado"}>
                  {got.source === "admin" ? <GiftIcon className="h-3.5 w-3.5" /> : <ChipIcon className="h-3.5 w-3.5" />}
                  {DATE.format(new Date(got.acquiredAt))}
                  {got.price ? ` · ${fmt(got.price)}` : ""}
                </div>
              )}
              {action === "equipped" ? (
                <button disabled className={`${btn} bg-white/5 text-emerald-300`}>
                  <Icon d={CHECK} />
                  Em uso
                </button>
              ) : action === "equip" ? (
                <button disabled={busy} onClick={onAction} className={`${btn} bg-emerald-400 text-emerald-950 hover:brightness-110`}>
                  Usar
                </button>
              ) : action === "buy" ? (
                <button disabled={busy} onClick={onAction} className={`${btn} bg-gold text-[#2a1a04] hover:brightness-110`}>
                  Comprar
                  <ChipIcon className="h-5 w-5" />
                  {fmt(entry.price)}
                </button>
              ) : (
                <button disabled className={`${btn} bg-white/5 text-red-300`}>
                  <Icon d={LOCK} />
                  <ChipIcon className="h-5 w-5" />
                  {fmt(entry.price)}
                </button>
              )}
            </div>
          </aside>

          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {ENTRIES[shopTab].map((e) => {
              const t = TIERS[e.tier];
              const on = e.id === entry.id;
              return (
                <li key={e.id}>
                  <button
                    onClick={() => setSel((s) => ({ ...s, [shopTab]: e.id }))}
                    className={`relative flex w-full flex-col items-center rounded-2xl border-t-[3px] bg-white/5 px-3 pb-3 pt-4 ring-1 transition hover:-translate-y-0.5 ${
                      on ? "ring-2" : "ring-white/10"
                    }`}
                    style={{ borderTopColor: t.color, ...(on ? { ["--tw-ring-color" as string]: t.color } : {}) }}
                  >
                    <span className="absolute right-2.5 top-2.5 h-2.5 w-2.5 rotate-45 rounded-[3px]" style={{ background: t.color }} />
                    <span className="flex h-28 items-center justify-center">
                      {shopTab === "frame" ? (
                        <ChipAvatar user={user} frame={e.def ? null : e.key} className="h-[72px] w-[72px] text-2xl" />
                      ) : (
                        <DeckPreview deck={e.key} className="h-28" />
                      )}
                    </span>
                    <span className="mt-2 text-sm font-semibold">{e.name}</span>
                    <span className="mt-1 flex h-5 items-center gap-1 text-sm font-bold tabular-nums">
                      {state && isEquipped(e) ? (
                        <Icon className="h-4 w-4 text-emerald-300" d={CHECK} />
                      ) : owned(e) && (state || e.def) ? (
                        <Icon className="h-4 w-4 text-white/40" d={CHECK} />
                      ) : (
                        <>
                          <ChipIcon className="h-4 w-4" />
                          {fmt(e.price)}
                        </>
                      )}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
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
