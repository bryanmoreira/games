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
