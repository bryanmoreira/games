/** Grade "#" da velha (empates). */
export function GridIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" aria-hidden="true">
      <path d="M9 3v18M15 3v18M3 9h18M3 15h18" />
    </svg>
  );
}

/** Peça sumindo (modo "some"): marca com rastro pontilhado. */
export function FadeIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" aria-hidden="true">
      <circle cx="15" cy="12" r="5" />
      <path d="M3 9h3M2 12h4M3 15h3" strokeDasharray="1 3" />
    </svg>
  );
}
