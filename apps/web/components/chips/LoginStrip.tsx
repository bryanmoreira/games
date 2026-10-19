import { ChipIcon } from "@/components/chips/ChipIcon";

/** Os 7 dias do login diário: pegos (ficha acesa), hoje (destacado) e os que faltam (apagados, com o valor). */
export function LoginStrip({ rewards, streak, today = false }: { rewards: readonly number[]; streak: number; today?: boolean }) {
  return (
    <ol className="grid grid-cols-7 gap-1">
      {rewards.map((v, i) => {
        const day = i + 1;
        const got = day <= streak;
        const now = today && day === streak;
        return (
          <li
            key={day}
            title={`Dia ${day}`}
            className={`flex flex-col items-center gap-0.5 rounded-lg py-1.5 ${now ? "chip-today bg-gold/20 ring-1 ring-gold" : got ? "bg-gold/10" : "bg-white/[0.04]"}`}
          >
            <span className="text-[9px] font-semibold text-white/40">{day}</span>
            <ChipIcon className={`${day === 7 ? "h-6 w-6" : "h-5 w-5"} ${got ? "" : "opacity-25 grayscale"}`} />
            <span className={`text-[10px] font-semibold ${got ? "text-gold" : "text-white/35"}`}>{v}</span>
          </li>
        );
      })}
    </ol>
  );
}
