import { Icon } from "@/components/ui/buttons";

type P = { className?: string };

export function UndoIcon({ className }: P) {
  return (
    <Icon className={className}>
      <path d="M9 14 4 9l5-5" />
      <path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11" />
    </Icon>
  );
}

export function HintIcon({ className }: P) {
  return (
    <Icon className={className}>
      <path d="m3 21 9-9" />
      <path d="M15 4V2" />
      <path d="M15 16v-2" />
      <path d="M8 9h2" />
      <path d="M20 9h2" />
      <path d="M17.8 11.8 19 13" />
      <path d="M17.8 6.2 19 5" />
      <path d="M12.2 6.2 11 5" />
    </Icon>
  );
}

export function PencilIcon({ className }: P) {
  return (
    <Icon className={className}>
      <path d="M17 3a2.8 2.8 0 0 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
      <path d="m15 5 4 4" />
    </Icon>
  );
}

export function EraseIcon({ className }: P) {
  return (
    <Icon className={className}>
      <path d="m7 21-4.3-4.3a1 1 0 0 1 0-1.4l9.6-9.6a1 1 0 0 1 1.4 0l5.6 5.6a1 1 0 0 1 0 1.4L13 21" />
      <path d="M22 21H7" />
      <path d="m5 11 9 9" />
    </Icon>
  );
}

export function ClockIcon({ className }: { className?: string }) {
  return (
    <Icon className={className}>
      <circle cx="12" cy="13" r="8" />
      <path d="M12 9v4l2.5 2" />
      <path d="M10 2h4" />
    </Icon>
  );
}

export function InfinityIcon({ className }: { className?: string }) {
  return (
    <Icon className={className}>
      <path d="M12 12c-2-2.7-3.6-4-5.3-4a4 4 0 0 0 0 8c1.7 0 3.3-1.3 5.3-4Zm0 0c2 2.7 3.6 4 5.3 4a4 4 0 0 0 0-8c-1.7 0-3.3 1.3-5.3 4Z" />
    </Icon>
  );
}

export function CheckIcon({ className }: { className?: string }) {
  return (
    <Icon className={className}>
      <path d="M20 6 9 17l-5-5" />
    </Icon>
  );
}

/** Tempo em m:ss (ou ∞ sem limite). */
export function TimeLabel({ seconds, className }: { seconds: number; className?: string }) {
  if (seconds === 0) return <InfinityIcon className={className ?? "h-5 w-5"} />;
  return <span className={className}>{`${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`}</span>;
}

export function ListIcon({ className }: { className?: string }) {
  return (
    <Icon className={className}>
      <path d="M9 6h11" />
      <path d="M9 12h11" />
      <path d="M9 18h11" />
      <path d="M4 6h.01" />
      <path d="M4 12h.01" />
      <path d="M4 18h.01" />
    </Icon>
  );
}

export function PersonIcon({ className }: P) {
  return (
    <Icon className={className}>
      <circle cx="12" cy="8" r="4" />
      <path d="M5 21a7 7 0 0 1 14 0" />
    </Icon>
  );
}

export function PeopleIcon({ className }: P) {
  return (
    <Icon className={className}>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20a6.5 6.5 0 0 1 13 0" />
      <path d="M15.5 4.6a3.5 3.5 0 0 1 0 6.8" />
      <path d="M18 14.2a6.5 6.5 0 0 1 3.5 5.8" />
    </Icon>
  );
}

export function GridIcon({ className }: P) {
  return (
    <Icon className={className}>
      <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="1.5" />
    </Icon>
  );
}

export function CalendarIcon({ className }: P) {
  return (
    <Icon className={className}>
      <rect x="3.5" y="5" width="17" height="15.5" rx="2.5" />
      <path d="M8 3v4M16 3v4M3.5 10h17" />
    </Icon>
  );
}

export function ChevronIcon({ className, left }: P & { left?: boolean }) {
  return <Icon className={className}>{left ? <path d="m15 18-6-6 6-6" /> : <path d="m9 18 6-6-6-6" />}</Icon>;
}

/** Apagar letra (tecla ⌫). */
export function BackspaceIcon({ className }: P) {
  return (
    <Icon className={className}>
      <path d="M9 5h11a1.5 1.5 0 0 1 1.5 1.5v11A1.5 1.5 0 0 1 20 19H9l-6.5-7Z" />
      <path d="m16.5 9.5-5 5M11.5 9.5l5 5" />
    </Icon>
  );
}

/** Enviar (tecla Enter). */
export function EnterIcon({ className }: P) {
  return (
    <Icon className={className}>
      <path d="M20 5v6a3 3 0 0 1-3 3H5" />
      <path d="m9 10-4 4 4 4" />
    </Icon>
  );
}

export function ShareIcon({ className }: P) {
  return (
    <Icon className={className}>
      <circle cx="18" cy="5.5" r="2.5" />
      <circle cx="6" cy="12" r="2.5" />
      <circle cx="18" cy="18.5" r="2.5" />
      <path d="m8.2 10.8 7.6-4.1M8.2 13.2l7.6 4.1" />
    </Icon>
  );
}

/** Estatísticas (barras). */
export function BarsIcon({ className }: P) {
  return (
    <Icon className={className}>
      <path d="M5 20v-6M12 20V5M19 20v-10" />
    </Icon>
  );
}

/** Ver o tabuleiro (fecha a tela de fim). */
export function EyeIcon({ className }: P) {
  return (
    <Icon className={className}>
      <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
      <circle cx="12" cy="12" r="3" />
    </Icon>
  );
}

/** Robô (nível da IA). */
export function BotIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="4" y="8" width="16" height="12" rx="3" />
      <path d="M12 8V4M9 13v1M15 13v1M2 13v3M22 13v3" />
    </svg>
  );
}
