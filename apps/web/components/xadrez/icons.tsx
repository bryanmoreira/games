import { Icon } from "@/components/ui/buttons";

/** ½: empate. */
export function HalfIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <Icon className={className}>
      <path d="M6 4v7" />
      <path d="M4 6l2-2" />
      <path d="M19 4 5 20" />
      <path d="M14 15a2.5 2.5 0 0 1 5 0c0 2-5 3-5 5h5" />
    </Icon>
  );
}

export function FlagIcon() {
  return (
    <Icon className="h-4 w-4">
      <path d="M5 21V4" />
      <path d="M5 4h11l-2 4 2 4H5" />
    </Icon>
  );
}

export function BulbIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <Icon className={className}>
      <path d="M9 18h6" />
      <path d="M10 22h4" />
      <path d="M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.3 1 2.1V17h6v-.2c0-.8.4-1.6 1-2.1A7 7 0 0 0 12 2Z" />
    </Icon>
  );
}
