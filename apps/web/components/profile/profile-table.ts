import { tableClass } from "@/lib/shop/catalog";

/** Cabeçalho do perfil em cima da mesa do jogador (feltro verde ou a da loja; a borda é sombra, por isso a margem). */
export const profileTable = (table?: string | null) =>
  `${tableClass(table)} m-3 flex items-center gap-5 rounded-[40px] px-6 py-6 sm:gap-8 sm:rounded-[96px] sm:px-14 sm:py-8`;
