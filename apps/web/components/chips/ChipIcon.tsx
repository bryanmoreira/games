/** Ficha dourada (a moeda do site). */
export function ChipIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true" className={className}>
      <circle cx="32" cy="32" r="31" fill="#f2c14e" />
      <circle cx="32" cy="32" r="26.5" fill="none" stroke="#9a6412" strokeWidth="8" strokeDasharray="10.4 10.4" />
      <circle cx="32" cy="32" r="18" fill="#e3ab2f" stroke="#9a6412" strokeWidth="2.5" />
      <path d="M32 21l3.2 6.6 7.3 1-5.3 5.1 1.3 7.2L32 37.5l-6.5 3.4 1.3-7.2-5.3-5.1 7.3-1z" fill="#fff4cf" />
    </svg>
  );
}

/** 1 a 3 fichinhas empilhadas: quanto a conquista vale. */
export function ChipStack({ level, className = "" }: { level: number; className?: string }) {
  return (
    <span className={`inline-flex items-center ${className}`}>
      {Array.from({ length: level }, (_, i) => (
        <ChipIcon key={i} className={`h-3.5 w-3.5 drop-shadow ${i ? "-ml-1.5" : ""}`} />
      ))}
    </span>
  );
}

export function GiftIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 11h16v10H4zM3 7h18v4H3zM12 7v14" />
      <path d="M12 7c-1.5-3-5-3.5-5-1.5S10 7 12 7Zm0 0c1.5-3 5-3.5 5-1.5S14 7 12 7Z" />
    </svg>
  );
}
