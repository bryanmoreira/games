"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChipIcon, GiftIcon } from "@/components/chips/ChipIcon";
import { DeckPreview } from "@/components/shop/Art";
import { TablePreview } from "@/components/shop/TablePreview";
import { ChipAvatar } from "@/components/ui/ChipFrame";
import { DEFAULT_DECK, DEFAULT_NAMES, ITEM_BY_ID, TIERS, deckKey, type ItemType, type Tier } from "@/lib/shop/catalog";
import { equip, type ShopStateJson } from "@/lib/shop/client";

const DATE = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "America/Sao_Paulo" });

/** Item do inventário: os que vêm com a conta (sem data) e os comprados/ganhos. key null = ficha vermelha / feltro verde. */
type Slot = { type: ItemType; key: string | null; name: string; tier: Tier | null; got?: ShopStateJson["items"][number] };

const SECTIONS: { type: ItemType; label: string }[] = [
  { type: "frame", label: "Molduras" },
  { type: "deck", label: "Baralhos" },
  { type: "table", label: "Mesas" },
];

const check = (
  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="m5 12 5 5L20 7" />
  </svg>
);

/** Tudo o que o jogador tem, por tipo, com quando chegou e o botão de usar. Na loja e em Perfil > Itens. */
export function Inventory({
  user,
  state,
  onChange,
}: {
  user: { name: string; image: string | null };
  state: ShopStateJson;
  onChange: (s: ShopStateJson) => void;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const slots = (type: ItemType): Slot[] => [
    { type, key: type === "deck" ? DEFAULT_DECK : null, name: DEFAULT_NAMES[type], tier: null },
    ...state.items.flatMap((got) => {
      const it = ITEM_BY_ID.get(got.itemId);
      return it && it.type === type ? [{ type, key: it.key, name: it.name, tier: it.tier, got }] : [];
    }),
  ];
  const inUse = (s: Slot) =>
    s.type === "deck" ? deckKey(state.equipped.deck) === s.key : (s.type === "frame" ? state.equipped.frame : state.equipped.table) === s.key;

  const use = async (s: Slot) => {
    setBusy(true);
    const r = await equip(s.type, s.type === "deck" && s.key === DEFAULT_DECK ? null : s.key);
    setBusy(false);
    if (r.state) onChange(r.state);
    router.refresh();
  };

  return (
    <div className="flex flex-col gap-6">
      {SECTIONS.map(({ type, label }) => {
        const list = slots(type);
        return (
          <section key={type} className="flex flex-col gap-3">
            <h2 className="flex items-center gap-2 font-display text-sm text-white/80">
              {label.toUpperCase()}
              <span className="text-xs tabular-nums text-white/40">{list.length}</span>
            </h2>
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {list.map((s) => {
                const on = inUse(s);
                const color = s.tier ? TIERS[s.tier].color : "#57534e";
                return (
                  <li
                    key={`${type}:${s.key}`}
                    className={`relative flex flex-col items-center rounded-2xl border-t-[3px] bg-white/5 px-3 pb-3 pt-4 ring-1 ${on ? "ring-2 ring-emerald-400/70" : "ring-white/10"}`}
                    style={{ borderTopColor: color }}
                  >
                    <span className="absolute right-2.5 top-2.5 h-2.5 w-2.5 rotate-45 rounded-[3px]" style={{ background: color }} title={s.tier ? TIERS[s.tier].label : undefined} />
                    <span className="flex h-24 items-center justify-center">
                      {type === "frame" ? (
                        <ChipAvatar user={user} frame={s.key} className="h-16 w-16 text-2xl" />
                      ) : type === "table" ? (
                        <TablePreview table={s.key} user={user} frame={state.equipped.frame} scale={0.42} />
                      ) : (
                        <DeckPreview deck={s.key ?? DEFAULT_DECK} className="h-24" />
                      )}
                    </span>
                    <span className="mt-2 text-sm font-semibold">{s.name}</span>
                    <span className="mt-0.5 flex h-4 items-center gap-1 text-[11px] text-white/45" title={s.got ? (s.got.source === "admin" ? "Presente" : "Comprado") : "Vem com a conta"}>
                      {s.got && (
                        <>
                          {s.got.source === "admin" ? <GiftIcon className="h-3 w-3 text-gold" /> : <ChipIcon className="h-3 w-3" />}
                          {DATE.format(new Date(s.got.acquiredAt))}
                          {s.got.price ? <span className="tabular-nums">· {s.got.price.toLocaleString("pt-BR")}</span> : null}
                        </>
                      )}
                    </span>
                    {on ? (
                      <span className="mt-2 flex h-8 w-full items-center justify-center gap-1 rounded-lg bg-emerald-400/10 text-xs font-semibold text-emerald-300">
                        {check}
                        Em uso
                      </span>
                    ) : (
                      <button
                        disabled={busy}
                        onClick={() => use(s)}
                        className="mt-2 h-8 w-full rounded-lg bg-white/10 text-xs font-semibold text-white transition hover:bg-emerald-400 hover:text-emerald-950 disabled:opacity-50"
                      >
                        Usar
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </div>
  );
}

/** Perfil > Itens: o inventário com o próprio estado. */
export function InventoryPage({ user, initial }: { user: { name: string; image: string | null }; initial: ShopStateJson }) {
  const [state, setState] = useState(initial);
  return <Inventory user={user} state={state} onChange={setState} />;
}
