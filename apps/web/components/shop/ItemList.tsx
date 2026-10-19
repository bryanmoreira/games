import Link from "next/link";
import { ChipIcon, GiftIcon } from "@/components/chips/ChipIcon";
import { DeckPreview, frameSrc } from "@/components/shop/Art";
import { ITEM_BY_ID, TIERS } from "@/lib/shop/catalog";
import type { OwnedItem } from "@/lib/shop/shop";

/** Também serve vindo em JSON (datas como texto). */
type Row = Omit<OwnedItem, "acquiredAt" | "removedAt"> & { acquiredAt: Date | string; removedAt: Date | string | null };

const DATE = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "America/Sao_Paulo" });
const TIME = new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" });

/** Miniatura do item: a moldura sozinha ou o baralho (verso + rei). */
export function ItemArt({ itemId, className = "h-16 w-16" }: { itemId: string; className?: string }) {
  const it = ITEM_BY_ID.get(itemId);
  if (!it) return null;
  if (it.type === "deck") return <DeckPreview deck={it.key} className={className} />;
  return (
    <span className={`relative flex items-center justify-center ${className}`}>
      <span className="h-[62.5%] w-[62.5%] rounded-full bg-[#2a5a40]" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={frameSrc(it.key)} alt="" draggable={false} className="pointer-events-none absolute inset-0 h-full w-full select-none" />
    </span>
  );
}

/**
 * Itens de um jogador com quando e como chegaram (compra com fichas ou presente do admin).
 * `action`: botão por item (o admin usa para tirar). Item tirado aparece apagado, com a data.
 */
export function ItemList({ items, action, empty }: { items: Row[]; action?: (it: Row) => React.ReactNode; empty?: React.ReactNode }) {
  if (!items.length) return <>{empty}</>;
  return (
    <ul className="grid gap-2 sm:grid-cols-2">
      {items.map((o) => {
        const it = ITEM_BY_ID.get(o.itemId);
        if (!it) return null;
        const tier = TIERS[it.tier];
        return (
          <li key={o.itemId} className={`flex items-center gap-3 rounded-2xl bg-white/5 p-2 pr-3 ring-1 ring-white/10 ${o.removedAt ? "opacity-45" : ""}`}>
            <ItemArt itemId={o.itemId} className="h-14 w-14 shrink-0" />
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="flex items-center gap-2 truncate text-sm font-semibold">
                <span className="h-2 w-2 shrink-0 rotate-45 rounded-[2px]" style={{ background: tier.color }} title={tier.label} />
                {it.name}
              </span>
              <span className="flex items-center gap-1.5 text-xs text-white/50" title={`${o.source === "admin" ? "Presente" : "Comprado"} às ${TIME.format(new Date(o.acquiredAt))}`}>
                {o.source === "admin" ? <GiftIcon className="h-3.5 w-3.5 text-gold" /> : <ChipIcon className="h-3.5 w-3.5" />}
                {DATE.format(new Date(o.acquiredAt))}
                {o.price ? <span className="tabular-nums">· {o.price.toLocaleString("pt-BR")}</span> : null}
              </span>
              {o.removedAt && (
                <span className="flex items-center gap-1.5 text-xs text-red-300" title="Tirado">
                  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2.25} strokeLinecap="round" aria-hidden="true">
                    <path d="M18 6 6 18M6 6l12 12" />
                  </svg>
                  {DATE.format(new Date(o.removedAt))}
                </span>
              )}
            </div>
            {action?.(o)}
          </li>
        );
      })}
    </ul>
  );
}

export function ShopLink({ children }: { children: React.ReactNode }) {
  return (
    <Link href="/loja" className="inline-flex items-center gap-2 rounded-xl bg-gold px-4 py-2 text-sm font-semibold text-[#2a1a04] transition hover:brightness-110">
      {children}
    </Link>
  );
}
