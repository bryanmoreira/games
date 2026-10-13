import { CalendarIcon } from "@/components/ui/icons";

const at = (day: string) => new Date(`${day}T12:00:00Z`);
const SHORT = new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "short", timeZone: "UTC" });
const LONG = new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });

/** "12 OUT" */
export const shortDay = (day: string) => SHORT.format(at(day)).replace(/\.| de/g, "").toUpperCase();

/** "segunda-feira, 12 de outubro" */
export const longDay = (day: string) => LONG.format(at(day));

/** Selo do desafio: calendário e o dia. */
export function DailyBadge({ day, className = "" }: { day: string; className?: string }) {
  return (
    <span className={`flex items-center gap-1.5 font-display text-xs ${className}`} title={`Desafio de ${longDay(day)}`}>
      <CalendarIcon className="h-4 w-4 text-gold" />
      {shortDay(day)}
    </span>
  );
}
