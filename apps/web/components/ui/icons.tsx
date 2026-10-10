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

export function TrophyIcon({ className = "h-16 w-16 text-gold" }: P) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M8 21h8" />
      <path d="M12 17v4" />
      <path d="M7 4h10v5a5 5 0 0 1-10 0V4Z" />
      <path d="M17 5h2.5a1.5 1.5 0 0 1 0 3c0 1.7-1.3 3-3 3" />
      <path d="M7 5H4.5a1.5 1.5 0 0 0 0 3c0 1.7 1.3 3 3 3" />
    </svg>
  );
}

export function ClockIcon({ className = "h-4 w-4" }: P) {
  return (
    <Icon className={className}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </Icon>
  );
}
