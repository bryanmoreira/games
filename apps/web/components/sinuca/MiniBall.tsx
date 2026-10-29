import { ballColor } from "./render";

/** Bolinha do placar: lisa colorida ou branca com faixa. */
export function MiniBall({ n, gone, size = 11 }: { n: number; gone?: boolean; size?: number }) {
  const color = ballColor(n);
  return (
    <svg viewBox="-10 -10 20 20" width={size} height={size} className={gone ? "opacity-20" : ""}>
      <defs>
        <clipPath id={`mb${n}`}>
          <circle r="9.5" />
        </clipPath>
      </defs>
      <circle r="9.5" fill={n > 8 ? "#f6f2e6" : color} />
      {n > 8 && <rect x="-10" y="-5" width="20" height="10" fill={color} clipPath={`url(#mb${n})`} />}
      <circle cx="-3" cy="-3.5" r="3" fill="rgba(255,255,255,0.45)" />
    </svg>
  );
}

/** Bola grande com brilho e número (logo e ilustrações). */
export function BallArt({ n, className }: { n: number; className?: string }) {
  const color = ballColor(n);
  const id = `ba${n}`;
  return (
    <svg viewBox="-50 -50 100 100" className={className} aria-hidden="true">
      <defs>
        <radialGradient id={`${id}s`} cx="-18" cy="-20" r="75" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#fff" stopOpacity="0.55" />
          <stop offset="0.3" stopColor="#fff" stopOpacity="0" />
          <stop offset="0.75" stopColor="#000" stopOpacity="0.12" />
          <stop offset="1" stopColor="#000" stopOpacity="0.5" />
        </radialGradient>
        <clipPath id={`${id}c`}>
          <circle r="48" />
        </clipPath>
      </defs>
      <circle r="48" fill={n > 8 || n === 0 ? "#f6f2e6" : color} />
      {n > 8 && <rect x="-50" y="-24" width="100" height="48" fill={color} clipPath={`url(#${id}c)`} />}
      {n > 0 && (
        <>
          <circle r="19" fill="#f6f2e6" />
          <text y="8" textAnchor="middle" fontSize={n > 9 ? 19 : 23} fontWeight="800" fontFamily="system-ui, sans-serif" fill="#141414">
            {n}
          </text>
        </>
      )}
      <circle r="48" fill={`url(#${id}s)`} />
    </svg>
  );
}
