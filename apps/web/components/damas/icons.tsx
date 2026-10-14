/** Empate: dois traços iguais. */
export function DrawIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" aria-hidden="true">
      <path d="M5 9h14M5 15h14" />
    </svg>
  );
}
