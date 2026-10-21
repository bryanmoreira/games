import { ChipAvatar } from "@/components/ui/ChipFrame";
import { tableClass } from "@/lib/shop/catalog";

const W = 344;
const H = 152;

/**
 * Mesa do perfil em miniatura: o cabeçalho (ficha + nome) desenhado em 344×152 e encolhido por `scale`,
 * para as bordas (box-shadow) ficarem na mesma proporção do perfil. Sem `user`, só a ficha vazia.
 */
export function TablePreview({
  table,
  user = { name: "", image: null },
  frame,
  scale = 0.5,
}: {
  table?: string | null;
  user?: { name: string; image: string | null };
  frame?: string | null;
  scale?: number;
}) {
  return (
    <span className="relative block shrink-0 select-none" style={{ width: W * scale, height: H * scale }}>
      <span className="absolute left-0 top-0 block origin-top-left p-4" style={{ width: W, height: H, transform: `scale(${scale})` }}>
        <span className={`${tableClass(table)} flex h-full w-full items-center gap-4 rounded-[64px] px-7`}>
          <ChipAvatar user={user} frame={frame} className="h-20 w-20 text-3xl" />
          <span className="h-3.5 w-24 rounded-full bg-gold/80" />
        </span>
      </span>
    </span>
  );
}
