import type { CSSProperties, ReactNode } from "react";

export const FRUIT_NAMES = ["Maçã", "Banana", "Morango", "Uva", "Laranja", "Limão", "Melancia", "Abacaxi", "Pera", "Cereja", "Pêssego", "Kiwi", "Coco", "Manga", "Mamão"] as const;

const leaf = <path d="M32 14C30 5 43 3 45 5c-1 8-7 12-13 9" fill="#418c48" />;
const stem = <path d="M31 18q-1-9 4-12" fill="none" stroke="#79502e" strokeWidth="3" strokeLinecap="round" />;
const shine = <path d="M20 26q-5 5-4 11" fill="none" stroke="#fff" strokeOpacity=".4" strokeWidth="3" strokeLinecap="round" />;
const fruits: ReactNode[] = [
  <>{stem}{leaf}<path d="M32 20C12 7 4 32 15 49q8 11 17 5 12 6 19-6c12-21 1-39-19-28" fill="#e94d55" />{shine}</>,
  <><path d="M14 13c-4 22 17 38 36 24-7 23-33 24-42 7C3 34 5 22 10 12" fill="#f5cc47" stroke="#d9a32b" strokeWidth="2" /><path d="M12 16c-2 22 17 37 34 25" fill="none" stroke="#fff1a1" strokeWidth="3" /><path d="m10 13 1-6 5 2-2 6M49 36l4-3 2 3-4 4" stroke="#765333" strokeWidth="3" /></>,
  <><path d="M12 25c-2-15 42-15 40 0C51 40 37 56 32 57S14 41 12 25" fill="#e94b54" /><path d="m13 17 13 1 6-11 5 11 14-2-10 10-9-5-10 5Z" fill="#448c48" />{[ [22,30],[35,30],[44,31],[27,40],[37,42],[32,49]].map(([x,y])=><ellipse key={`${x}-${y}`} cx={x} cy={y} rx="1.2" ry="2" fill="#ffe3a0" />)}</>,
  <>{stem}{leaf}{[[22,24],[37,23],[15,35],[30,35],[44,35],[23,46],[37,46],[30,55]].map(([x,y],i)=><circle key={i} cx={x} cy={y} r="8" fill={i%2 ? "#8661b4" : "#694699"} stroke="#57377d" strokeWidth="1" />)}<circle cx="20" cy="22" r="2" fill="#c6b2df" /></>,
  <>{stem}{leaf}<circle cx="31" cy="36" r="23" fill="#f6a036" />{shine}<path d="M40 20q13 9 9 23" fill="none" stroke="#e28624" strokeWidth="3" /></>,
  <><path d="M9 36C4 20 21 7 37 14c9 4 10 10 19 13-3 7-1 18-13 23C27 60 11 50 9 36" fill="#e9d54a" />{leaf}{shine}</>,
  <><path d="M5 20h54L35 57q-3 4-6 0Z" fill="#4b9c54" /><path d="M9 22h46L34 53q-2 3-4 0Z" fill="#d6e9aa" /><path d="M12 23h40L33 49q-1 2-2 0Z" fill="#ec6262" />{[[23,28],[39,28],[31,37]].map(([x,y],i)=><ellipse key={i} cx={x} cy={y} rx="1.5" ry="2.6" fill="#493c32" />)}</>,
  <><path d="m21 21-8-10 12 4 6-13 5 13 13-5-7 13" fill="#4d9252" /><rect x="14" y="20" width="36" height="39" rx="15" fill="#ecc04a" /><path d="m17 27 29 23M15 37l25 19M24 22l24 19M46 27 18 50M49 37 25 57M39 22 16 41" stroke="#cf9a31" strokeWidth="1.8" /></>,
  <>{stem}{leaf}<path d="M24 18c-2 14-16 16-15 30 1 16 44 16 45 0 1-14-14-17-15-30-2-9-13-9-15 0" fill="#a5bd57" />{shine}</>,
  <><path d="M17 35q11-15 15-28 2 20 14 27" fill="none" stroke="#71964c" strokeWidth="3" strokeLinecap="round" />{leaf}<circle cx="17" cy="44" r="13" fill="#cf4051" /><circle cx="46" cy="44" r="13" fill="#e45361" /><path d="m11 39-2 5m32-5-2 5" stroke="#ffb4b2" strokeWidth="3" strokeLinecap="round" /></>,
  <>{stem}{leaf}<path d="M32 20C13 7 5 29 13 46c8 18 29 18 39 0 9-18-1-39-20-26" fill="#f2a478" /><path d="M32 22q-7 17 1 32" fill="none" stroke="#dc7a68" strokeWidth="2" />{shine}</>,
  <><ellipse cx="32" cy="35" rx="25" ry="23" fill="#98704b" /><ellipse cx="32" cy="34" rx="21" ry="20" fill="#a6c661" /><circle cx="32" cy="34" r="8" fill="#e5eac4" />{Array.from({length:10},(_,i)=><ellipse key={i} cx="32" cy="20" rx="1.2" ry="2" fill="#464633" transform={`rotate(${i*36} 32 34)`} />)}</>,
  <><path d="M7 34a25 25 0 0 0 50 0Z" fill="#865c3e" /><ellipse cx="32" cy="33" rx="25" ry="18" fill="#b18b68" /><ellipse cx="32" cy="33" rx="21" ry="14" fill="#faf1de" /><ellipse cx="32" cy="34" rx="13" ry="8" fill="#ded5bf" /></>,
  <>{stem}{leaf}<path d="M18 20c19-15 40-1 36 20-3 19-22 24-37 14C3 44 7 30 18 20" fill="#efa846" /><path d="M45 22q11 24-15 32" fill="none" stroke="#eb7954" strokeWidth="8" strokeLinecap="round" />{shine}</>,
  <><path d="M28 7C11 17 4 36 14 51c8 12 27 10 35-3 9-16-3-35-15-41Z" fill="#77a04b" /><path d="M31 11C18 21 11 37 19 48c5 8 19 9 25-2 7-12-2-27-13-35" fill="#f38a44" /><ellipse cx="32" cy="35" rx="7" ry="13" fill="#ffc163" />{[[30,27],[35,31],[29,35],[35,39],[31,44]].map(([x,y],i)=><circle key={i} cx={x} cy={y} r="2" fill="#4f4034" />)}</>,
];

/** Ilustração compartilhada pela mesa, ajuda, catálogo e prévia de link. */
export function Fruit({ fruit, className = "", ...size }: { fruit: number; className?: string; width?: number; height?: number }) {
  return <svg viewBox="0 0 64 64" className={className} {...size} aria-hidden="true">{fruits[fruit]}</svg>;
}

export function MemoryArt({ play = false, className = "", width, height }: { play?: boolean; className?: string; width?: number; height?: number }) {
  return <svg viewBox="0 0 300 210" className={className} width={width} height={height} aria-hidden="true">
    {[0,1,2,3,4,5].map((i) => <g key={i} transform={`translate(${17 + i % 3 * 91} ${12 + Math.floor(i / 3) * 99})`}>
      <g className={play && (i === 1 || i === 4) ? "hc-memory-card" : undefined} style={play && (i === 1 || i === 4) ? { "--mm-flip-delay": i === 1 ? "120ms" : "480ms" } as CSSProperties : undefined}>
      <rect x="0" y="4" width="80" height="88" rx="10" fill="#092f25" opacity=".6" />
      <rect width="80" height="88" rx="10" fill="#faf2dd" />
      <g transform="translate(8 10)">{fruits[[0,2,3,0,2,3][i]]}</g>
      <g className={play && (i === 1 || i === 4) ? "hc-memory-back" : undefined}>
        <rect width="80" height="88" rx="10" fill="#235847" />
        <rect x="5" y="5" width="70" height="78" rx="7" fill="none" stroke="#e9cc80" strokeWidth="1.5" />
        <path d="M40 25v37M22 44h36M27 31l26 26M53 31 27 57" stroke="#d7b65c" strokeWidth="3" strokeLinecap="round" />
      </g>
      {(i === 0 || i === 3) && <g><rect width="80" height="88" rx="10" fill="#faf2dd" /><g transform="translate(8 10)">{fruits[0]}</g></g>}
      {play && (i === 1 || i === 4) && <rect className="hc-memory-match" width="80" height="88" rx="10" fill="none" stroke="#f2c14e" strokeWidth="3" opacity="0" />}
      </g>
    </g>)}
  </svg>;
}
