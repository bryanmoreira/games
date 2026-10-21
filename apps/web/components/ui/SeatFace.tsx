import type { SeatInfo } from "@mesa/truco";

/**
 * Conteúdo do círculo do jogador: foto da conta (logado), 🤖 (IA) ou a inicial do nome.
 * O círculo (tamanho, borda, cor) é de cada mesa; ele precisa de `overflow-hidden` para a foto.
 */
export function SeatFace({ seat }: { seat: Pick<SeatInfo, "kind" | "name" | "image"> | undefined }) {
  if (seat?.kind === "bot") return <>🤖</>;
  if (seat?.image) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={seat.image} alt="" referrerPolicy="no-referrer" className="h-full w-full rounded-full object-cover" />;
  }
  return <>{(seat?.name || "?").slice(0, 1).toUpperCase()}</>;
}
