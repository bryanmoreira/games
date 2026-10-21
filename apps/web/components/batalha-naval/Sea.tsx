import { FLEET, SIZE, type Dir, type Ship } from "@mesa/batalha-naval";

/** Posição de um item no mar, em % (col/row a partir do canto de cima à esquerda). */
export function cellStyle(col: number, row: number, w = 1, h = 1): React.CSSProperties {
  return { left: `${(col * 100) / SIZE}%`, top: `${(row * 100) / SIZE}%`, width: `${(w * 100) / SIZE}%`, height: `${(h * 100) / SIZE}%` };
}

export const shipBox = (ship: Ship, index: number) => {
  const len = FLEET[index].size;
  return ship.dir === "h" ? cellStyle(ship.col, ship.row, len, 1) : cellStyle(ship.col, ship.row, 1, len);
};

/** O mar quadrado (10×10) com a grade; os filhos são posicionados com `cellStyle`. */
export function Sea({ className = "", children, ...rest }: React.ComponentProps<"div">) {
  return (
    <div className={`sea relative aspect-square select-none rounded-md ${className}`} {...rest}>
      {children}
    </div>
  );
}

export type ShipTone = "steel" | "sunk" | "ghost" | "gold" | "red" | "bad";

const TONES: Record<ShipTone, { hull: string; deck: string; line: string; detail: string }> = {
  steel: { hull: "#9eacba", deck: "#c3ced8", line: "#3c4855", detail: "#5d6b79" },
  sunk: { hull: "#3a3634", deck: "#4b4440", line: "#120f0e", detail: "#211d1b" },
  ghost: { hull: "#9eacba", deck: "#c3ced8", line: "#3c4855", detail: "#5d6b79" },
  gold: { hull: "#f2c14e", deck: "#ffe08a", line: "#7a4e0c", detail: "#b07d18" },
  red: { hull: "#f87171", deck: "#fca5a5", line: "#7f1d1d", detail: "#b91c1c" },
  bad: { hull: "#f87171", deck: "#fca5a5", line: "#7f1d1d", detail: "#b91c1c" },
};

/**
 * Desenho de um navio da frota (`index` em FLEET), deitado ou em pé, ocupando a caixa inteira.
 * Cada casa mede 10 unidades no viewBox.
 */
export function ShipShape({ index, dir = "h", tone = "steel", className = "" }: { index: number; dir?: Dir; tone?: ShipTone; className?: string }) {
  const len = FLEET[index].size * 10;
  const c = TONES[tone];
  const vertical = dir === "v";
  return (
    <svg
      viewBox={vertical ? `0 0 10 ${len}` : `0 0 ${len} 10`}
      className={`block h-full w-full ${tone === "ghost" ? "opacity-55" : ""} ${className}`}
      aria-hidden="true"
    >
      <g transform={vertical ? "translate(10 0) rotate(90)" : undefined} strokeLinejoin="round" strokeLinecap="round">
        <ShipArt index={index} len={len} c={c} />
      </g>
    </svg>
  );
}

function ShipArt({ index, len, c }: { index: number; len: number; c: (typeof TONES)[ShipTone] }) {
  const L = len;
  if (index === 3) {
    // submarino: casco arredondado nas duas pontas e torre no meio
    return (
      <>
        <path d={`M3.5 2.6 H${L - 3.5} Q${L - 0.6} 5 ${L - 3.5} 7.4 H3.5 Q0.6 5 3.5 2.6 Z`} fill={c.hull} stroke={c.line} strokeWidth={0.7} />
        <rect x={L / 2 - 4} y={3.6} width={7} height={2.8} rx={1.2} fill={c.deck} stroke={c.line} strokeWidth={0.5} />
        <path d={`M${L / 2 - 1.5} 5 H${L / 2 + 1.5}`} stroke={c.detail} strokeWidth={0.8} />
        <path d={`M2 5 H0.6 M2.4 3.6 L1 2.8 M2.4 6.4 L1 7.2`} stroke={c.line} strokeWidth={0.6} />
      </>
    );
  }
  const hull = `M1.6 1.6 H${L - 5.5} Q${L - 0.5} 5 ${L - 5.5} 8.4 H1.6 Q0.6 5 1.6 1.6 Z`;
  if (index === 0) {
    // porta-aviões: convés plano com pista e ilha
    return (
      <>
        <path d={`M1 1.3 H${L - 4.5} Q${L - 0.5} 5 ${L - 4.5} 8.7 H1 Z`} fill={c.hull} stroke={c.line} strokeWidth={0.7} />
        <path d={`M4 5 H${L - 8}`} stroke={c.deck} strokeWidth={0.8} strokeDasharray="2.4 1.8" />
        <path d={`M3 2.6 L${L - 12} 2.6`} stroke={c.detail} strokeWidth={0.5} />
        <rect x={L - 17} y={6.2} width={6} height={2} rx={0.5} fill={c.deck} stroke={c.line} strokeWidth={0.5} />
      </>
    );
  }
  // navios de guerra: casco com proa, convés, ponte e torres
  const turrets = index === 1 ? [7, 15, L - 10] : index === 2 ? [7, L - 9] : [L - 8];
  const bridge = index === 1 ? [L / 2 - 2, 6] : index === 2 ? [L / 2 - 3.5, 5] : [5, 5];
  return (
    <>
      <path d={hull} fill={c.hull} stroke={c.line} strokeWidth={0.7} />
      <rect x={3} y={3.2} width={L - 10} height={3.6} rx={1.6} fill={c.deck} />
      <rect x={bridge[0]} y={2.6} width={bridge[1]} height={4.8} rx={1} fill={c.hull} stroke={c.line} strokeWidth={0.5} />
      {turrets.map((x) => (
        <g key={x}>
          <path d={`M${x} 5 H${x + (x > L / 2 ? 3.6 : -3.6)}`} stroke={c.line} strokeWidth={0.9} />
          <circle cx={x} cy={5} r={1.9} fill={c.detail} stroke={c.line} strokeWidth={0.5} />
        </g>
      ))}
    </>
  );
}

/** Navio posicionado no mar. */
export function SeaShip({
  ship,
  index,
  tone,
  className = "",
  style,
  children,
}: {
  ship: Ship;
  index: number;
  tone?: ShipTone;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}) {
  return (
    <div className={`absolute p-[0.3%] ${className}`} style={{ ...shipBox(ship, index), ...style }}>
      <ShipShape index={index} dir={ship.dir} tone={tone} />
      {children}
    </div>
  );
}

/** Tiro na água. */
export function Splash({ className = "" }: { className?: string }) {
  return (
    <span className={`absolute inset-0 flex items-center justify-center ${className}`}>
      <span className="h-[30%] w-[30%] rounded-full bg-white/75 shadow-[0_0_0_2px_rgba(255,255,255,0.18)]" />
    </span>
  );
}

/** Acerto: fogo (navio ainda boiando) ou brasa apagada (navio afundado). */
export function Fire({ out = false, className = "" }: { out?: boolean; className?: string }) {
  return (
    <span className={`absolute inset-0 flex items-center justify-center ${className}`}>
      <svg viewBox="0 0 24 24" className={`h-[80%] w-[80%] ${out ? "opacity-80" : "bn-fire"}`} aria-hidden="true">
        {out ? (
          <path d="M7 7l10 10M17 7 7 17" stroke="#ef4444" strokeWidth={3.2} strokeLinecap="round" />
        ) : (
          <>
            <path
              d="M12 2.5c1 3.2 4.8 5 4.8 9.7a4.8 4.8 0 0 1-9.6 0c0-2 1-3.2 2-4.3.2 1.6 1 2.5 1.9 2.7-.3-3.2.4-5.9.9-8.1Z"
              fill="#ef4444"
              stroke="#7f1d1d"
              strokeWidth={1}
              strokeLinejoin="round"
              transform="translate(0 4.5) scale(1 0.85)"
            />
            <path d="M12 12.5c.6 1.4 2.3 2.2 2.3 4.2a2.3 2.3 0 0 1-4.6 0c0-1.2.9-2 1.4-2.6.3.8.6 1 .9 1-.2-1.1-.2-1.8 0-2.6Z" fill="#fbbf24" />
          </>
        )}
      </svg>
    </span>
  );
}

/** Efeito do último tiro: mira descendo e uma onda de água ou de fogo. */
export function ShotFx({ hit }: { hit: boolean }) {
  return (
    <span className="pointer-events-none absolute inset-0 z-20">
      <svg viewBox="0 0 24 24" className="bn-aim absolute inset-0 h-full w-full text-gold" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden="true">
        <circle cx="12" cy="12" r="7" />
        <path d="M12 2v5M12 17v5M2 12h5M17 12h5" />
      </svg>
      <span className={`bn-ring absolute inset-[10%] rounded-full border-[3px] ${hit ? "border-orange-400" : "border-sky-200"}`} />
    </span>
  );
}

/** Mira do cursor sobre o mar inimigo. */
export function Crosshair({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={`h-full w-full text-gold ${className}`} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden="true">
      <circle cx="12" cy="12" r="7" />
      <path d="M12 2v5M12 17v5M2 12h5M17 12h5" />
    </svg>
  );
}

/** A frota em fila (do maior para o menor); afundados aparecem escuros e riscados. */
export function FleetRow({ sunk, tone = "steel", className = "" }: { sunk?: Set<number>; tone?: ShipTone; className?: string }) {
  return (
    <div className={`flex items-center justify-center gap-[0.35em] ${className}`}>
      {FLEET.map((k, i) => {
        const down = sunk?.has(i);
        return (
          <div key={k.id} className="relative h-[1em]" style={{ width: `${k.size}em` }} title={k.name}>
            <ShipShape index={i} tone={down ? "sunk" : tone} className={down ? "opacity-70" : ""} />
            {down && <span className="absolute left-0 right-0 top-1/2 h-[2px] -translate-y-1/2 rotate-[-8deg] rounded bg-red-500" />}
          </div>
        );
      })}
    </div>
  );
}

/** Mar ampliado (6×6) de enfeite: logo do hub e da página do jogo. */
/** `salvo`: tiros que acertam ao passar o mouse no card da home (.hc-pop), um por vez. */
export function SeaLogo({ className = "", salvo = [] }: { className?: string; salvo?: [number, number][] }) {
  const N = 6;
  const at = (col: number, row: number, w = 1, h = 1): React.CSSProperties => ({
    left: `${(col * 100) / N}%`,
    top: `${(row * 100) / N}%`,
    width: `${(w * 100) / N}%`,
    height: `${(h * 100) / N}%`,
  });
  const grid = `${100 / N}% ${100 / N}%`;
  return (
    <div className={`sea relative aspect-square rounded-sm ${className}`} style={{ backgroundSize: `${grid}, ${grid}, 100% 100%` }}>
      <div className="absolute p-[1%]" style={at(1, 1, 4, 1)}>
        <ShipShape index={1} />
      </div>
      <div className="absolute p-[1%]" style={at(4, 3, 1, 3)}>
        <ShipShape index={2} dir="v" />
      </div>
      <div className="absolute p-[1%]" style={at(0, 4, 2, 1)}>
        <ShipShape index={4} tone="sunk" />
      </div>
      {[
        [2, 1],
        [3, 1],
      ].map(([c, r]) => (
        <span key={`f${c}`} className="absolute" style={at(c, r)}>
          <Fire />
        </span>
      ))}
      {[
        [0, 4],
        [1, 4],
      ].map(([c, r]) => (
        <span key={`o${c}`} className="absolute" style={at(c, r)}>
          <Fire out />
        </span>
      ))}
      {[
        [0, 2],
        [2, 3],
        [5, 0],
      ].map(([c, r]) => (
        <span key={`s${c}${r}`} className="absolute" style={at(c, r)}>
          <Splash />
        </span>
      ))}
      <span className="absolute p-[2%]" style={at(4, 1)}>
        <Crosshair />
      </span>
      {salvo.map(([c, r], i) => (
        <span key={`h${c}${r}`} className="hc-pop absolute" style={{ ...at(c, r), "--d": i } as React.CSSProperties}>
          <Fire />
        </span>
      ))}
    </div>
  );
}
