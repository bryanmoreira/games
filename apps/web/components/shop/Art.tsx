import { DEFAULT_DECK, deckKey, frameKey, type DeckKey } from "@/lib/shop/catalog";

/** Arquivos gerados em app/molduras e app/baralhos (o clássico usa as PNG de public/cards). */
export const frameSrc = (key: string) => `/molduras/${key}.svg`;
export const backSrc = (deck: DeckKey) => `/baralhos/${deck}/verso.svg`;
export const faceSrc = (deck: DeckKey, file: string) => (deck === DEFAULT_DECK ? `/cards/${file}.png` : `/baralhos/${deck}/${file}.svg`);

/**
 * Anel da moldura por cima de um círculo de foto: fica no pai `relative` do círculo e passa 30% para cada lado
 * (a foto ocupa 80/128 da moldura). Sem moldura (null/desconhecida) não desenha nada.
 */
export function FrameRing({ frame, className = "" }: { frame?: string | null; className?: string }) {
  const key = frameKey(frame);
  if (!key) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={frameSrc(key)}
      alt=""
      aria-hidden="true"
      draggable={false}
      className={`pointer-events-none absolute -inset-[30%] h-[160%] w-[160%] max-w-none select-none ${className}`}
    />
  );
}

/** Envolve um círculo de foto (de qualquer tamanho) com a moldura do jogador. */
export function Framed({ frame, className = "", children }: { frame?: string | null; className?: string; children: React.ReactNode }) {
  if (!frameKey(frame)) return <>{children}</>;
  return (
    <span className={`relative inline-flex shrink-0 ${className}`}>
      {children}
      <FrameRing frame={frame} />
    </span>
  );
}

/** Verso + rei de copas cruzados: miniatura de um baralho. */
export function DeckPreview({ deck, className = "" }: { deck: string; className?: string }) {
  const k = deckKey(deck);
  return (
    <span className={`relative inline-block aspect-square select-none ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={backSrc(k)} alt="" draggable={false} className="absolute left-[6%] top-[8%] w-[54%] -rotate-[10deg] drop-shadow-[0_4px_6px_rgba(0,0,0,0.45)]" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={faceSrc(k, "king_of_hearts")}
        alt=""
        draggable={false}
        className="absolute left-[38%] top-[14%] w-[54%] rotate-[9deg] rounded-[7%/5%] drop-shadow-[0_4px_6px_rgba(0,0,0,0.45)]"
      />
    </span>
  );
}
