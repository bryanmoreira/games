import Link from "next/link";
import { CalendarIcon } from "@/components/ui/icons";

/** Fita diagonal no canto do card dos jogos com desafio do dia: leva direto ao desafio. */
export function DailyRibbon({ href }: { href: string }) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-3xl">
      <Link
        href={href}
        title="Desafio do dia"
        className="pointer-events-auto absolute -left-[38px] top-[26px] flex w-[150px] -rotate-45 items-center justify-center gap-1.5 bg-gold py-1.5 font-display text-[10px] tracking-wider text-[#3b2606] shadow-[0_3px_8px_rgba(0,0,0,0.45)] transition hover:brightness-110"
      >
        <CalendarIcon className="h-3.5 w-3.5" />
        DIÁRIO
      </Link>
    </div>
  );
}
