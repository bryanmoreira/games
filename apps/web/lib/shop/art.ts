import { DECK_KEYS, FRAME_KEYS, type DeckKey, type FrameKey } from "@/lib/shop/catalog";

/*
 * Desenho das molduras e dos baralhos da loja, como texto SVG. Cada um vira um arquivo servido como imagem
 * (app/molduras e app/baralhos): leve, guardado no cache e sem texto para selecionar com o mouse.
 * Arquivo SVG em <img> não carrega fonte de fora: só fontes do sistema aqui. Animação só em SMIL.
 */

// ---------- naipes (caixa 20x20) ----------

export type SuitName = "spades" | "hearts" | "diamonds" | "clubs";

const SUIT_PATHS: Record<SuitName, string> = {
  hearts: `<path d="M10 18C10 18 1 12 1 6.5 1 3.5 3.3 1.5 6 1.5c1.8 0 3.2 1.1 4 2.5.8-1.4 2.2-2.5 4-2.5 2.7 0 5 2 5 5C19 12 10 18 10 18Z"/>`,
  diamonds: `<path d="M10 .5L18 10 10 19.5 2 10Z"/>`,
  spades: `<path d="M10 1S1 8 1 12c0 2.8 2.2 4.5 4.6 4.5 1.6 0 2.9-.8 3.6-1.9-.2 1.9-1 3.4-2.7 4.4h7c-1.7-1-2.5-2.5-2.7-4.4.7 1.1 2 1.9 3.6 1.9 2.4 0 4.6-1.7 4.6-4.5C19 8 10 1 10 1Z"/>`,
  clubs: `<circle cx="10" cy="5.5" r="4.3"/><circle cx="5" cy="11.5" r="4.3"/><circle cx="15" cy="11.5" r="4.3"/><path d="M9 10c0 4.5-1 7.5-3 9h8c-2-1.5-3-4.5-3-9Z"/>`,
};
const suitG = (suit: SuitName, cx: number, cy: number, size: number, color: string) =>
  `<g transform="translate(${cx - size / 2} ${cy - size / 2}) scale(${size / 20})" fill="${color}">${SUIT_PATHS[suit]}</g>`;

const SERIF = "Georgia, 'Times New Roman', serif";
const SANS = "'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
const DISPLAY = "'Arial Black', Impact, sans-serif";
const DIDONE = "Didot, 'Bodoni MT', Georgia, serif";

const svg = (viewBox: string, body: string) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}">${body}</svg>`;
const spin = (s: number, rev = false) =>
  `<animateTransform attributeName="transform" type="rotate" from="${rev ? 360 : 0} 60 60" to="${rev ? 0 : 360} 60 60" dur="${s}s" repeatCount="indefinite"/>`;
const sparkle = (x: number, y: number, d: number) =>
  `<path d="M${x} ${y - 5}l1.4 3.6 3.6 1.4-3.6 1.4-1.4 3.6-1.4-3.6-3.6-1.4 3.6-1.4z" fill="#fff"><animate attributeName="opacity" values="0;1;0" dur="1.8s" begin="${d}s" repeatCount="indefinite"/></path>`;
const pulse = `<animate attributeName="opacity" values="1;.55;1" dur="1.8s" repeatCount="indefinite"/>`;
const glow = (id: string, dev = 2.5) =>
  `<filter id="${id}" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="${dev}" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`;
/** Degradê holográfico: as cores andam sozinhas. */
const HOLO = ["#f0abfc", "#93c5fd", "#86efac", "#fde68a"];
const holoGradient = (id: string) =>
  `<linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1">${HOLO.map((c, i) => {
    const cycle = [...HOLO.slice(i), ...HOLO.slice(0, i), c].join(";");
    return `<stop offset="${i / (HOLO.length - 1)}" stop-color="${c}"><animate attributeName="stop-color" values="${cycle}" dur="5s" repeatCount="indefinite"/></stop>`;
  }).join("")}</linearGradient>`;
const GOLD_STOPS = `<stop offset="0" stop-color="#fff2c2"/><stop offset=".45" stop-color="#f2c14e"/><stop offset=".7" stop-color="#e3ab2f"/><stop offset="1" stop-color="#fbe39a"/>`;
/** Faixa de brilho que passa por cima (ouro, holográfico). */
const shine = (x: number, y: number, w: number, h: number, rx: number) =>
  `<linearGradient id="sh" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".75"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
  <clipPath id="sc"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}"/></clipPath>
  <g clip-path="url(#sc)"><rect x="-60" y="-20" width="26" height="200" fill="url(#sh)" transform="rotate(20)"><animateTransform attributeName="transform" type="translate" values="-40 0;190 0" dur="3.2s" repeatCount="indefinite"/></rect></g>`;

// ---------- molduras: viewBox -4 -4 128 128, a foto fica no centro com raio 40 (62,5% do lado) ----------

/** Tamanho da moldura em relação à foto: a foto ocupa 80/128 do quadrado. */
export const FRAME_SCALE = 128 / 80;

const FRAMES: Record<FrameKey, string> = {
  madeira: `<circle cx="60" cy="60" r="46" fill="none" stroke="#8b5a2b" stroke-width="10"/>
    <circle cx="60" cy="60" r="46" fill="none" stroke="#a8713a" stroke-width="2.5" stroke-dasharray="16 7 5 11"/>
    <circle cx="60" cy="60" r="44" fill="none" stroke="#6e4420" stroke-width="1.5" stroke-dasharray="9 14 3 6"/>
    <circle cx="60" cy="60" r="51" fill="none" stroke="#3b2412" stroke-width="1.5"/><circle cx="60" cy="60" r="41" fill="none" stroke="#3b2412" stroke-width="1.5"/>`,
  prata: `<linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fafafa"/><stop offset=".45" stop-color="#9ca3af"/><stop offset=".7" stop-color="#e5e7eb"/><stop offset="1" stop-color="#6b7280"/></linearGradient>
    <circle cx="60" cy="60" r="46" fill="none" stroke="url(#g)" stroke-width="8"/>
    <circle cx="60" cy="60" r="50.5" fill="none" stroke="#4b5563" stroke-width="1"/><circle cx="60" cy="60" r="41.5" fill="none" stroke="#4b5563" stroke-width="1"/>`,
  feltro: `<circle cx="60" cy="60" r="46" fill="none" stroke="#0f5132" stroke-width="11"/>
    <circle cx="60" cy="60" r="46" fill="none" stroke="#f2c14e" stroke-width="1.4" stroke-dasharray="3.5 3"/>
    <circle cx="60" cy="60" r="52" fill="none" stroke="#5b3a1e" stroke-width="2.5"/>`,
  ficha: `<circle cx="60" cy="60" r="50" fill="none" stroke="#9a6412" stroke-width="2"/>
    <circle cx="60" cy="60" r="46" fill="none" stroke="#f2c14e" stroke-width="10"/>
    <circle cx="60" cy="60" r="46" fill="none" stroke="#9a6412" stroke-width="10" stroke-dasharray="9.03 9.03"/>
    <circle cx="60" cy="60" r="41" fill="none" stroke="#e3ab2f" stroke-width="2"/>`,
  naipes: `<circle cx="60" cy="60" r="46" fill="none" stroke="#1c1917" stroke-width="11"/>
    <circle cx="60" cy="60" r="52" fill="none" stroke="#f2c14e" stroke-width="1.5"/><circle cx="60" cy="60" r="40.5" fill="none" stroke="#f2c14e" stroke-width="1.5"/>
    ${(
      [
        ["spades", 60, 14, "#111"],
        ["hearts", 106, 60, "#ef4444"],
        ["clubs", 60, 106, "#111"],
        ["diamonds", 14, 60, "#ef4444"],
      ] as const
    )
      .map(([s, x, y, c]) => `<circle cx="${x}" cy="${y}" r="9" fill="#f5efe0" stroke="#f2c14e" stroke-width="1.5"/>${suitG(s, x, y, 11, c)}`)
      .join("")}`,
  neon: `${glow("gl")}<g filter="url(#gl)"><circle cx="60" cy="60" r="45" fill="none" stroke="#22d3ee" stroke-width="3.5">${pulse}</circle>
    <circle cx="60" cy="60" r="51" fill="none" stroke="#e879f9" stroke-width="2" stroke-dasharray="40 12">${spin(8)}</circle></g>`,
  coroa: `<linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fde68a"/><stop offset="1" stop-color="#d4961f"/></linearGradient>
    <circle cx="60" cy="60" r="45" fill="none" stroke="url(#g)" stroke-width="7"/>
    <circle cx="60" cy="60" r="49" fill="none" stroke="#9a6412" stroke-width="1.2"/>
    <path d="M38 24 L41 4 L50 15 L60 0 L70 15 L79 4 L82 24 Z" fill="url(#g)" stroke="#9a6412" stroke-width="2" stroke-linejoin="round"/>
    <circle cx="60" cy="16" r="3.5" fill="#dc2626"/><circle cx="47" cy="19" r="2.5" fill="#2563eb"/><circle cx="73" cy="19" r="2.5" fill="#2563eb"/>
    ${[[60, 105], [15, 60], [105, 60]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="4" fill="#dc2626" stroke="#9a6412" stroke-width="1.2"/>`).join("")}`,
  fogo: `<linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fde047"/><stop offset=".35" stop-color="#f97316"/><stop offset=".7" stop-color="#dc2626"/><stop offset="1" stop-color="#fde047"/></linearGradient>
    <g>${spin(3)}<circle cx="60" cy="60" r="46" fill="none" stroke="url(#g)" stroke-width="9"/></g>
    <g>${spin(5, true)}${Array.from({ length: 12 }, (_, i) => `<path d="M60 3 q4 6 0 10 q-4 -4 0 -10z" fill="${i % 2 ? "#f97316" : "#fde047"}" transform="rotate(${i * 30} 60 60)"/>`).join("")}</g>`,
  royal: `<linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff7d6"/><stop offset=".25" stop-color="#f2c14e"/><stop offset=".5" stop-color="#9a6412"/><stop offset=".75" stop-color="#f2c14e"/><stop offset="1" stop-color="#fff7d6"/></linearGradient>
    <circle cx="60" cy="60" r="46" fill="none" stroke="url(#g)" stroke-width="9"/>
    <circle cx="60" cy="60" r="51.5" fill="none" stroke="#f2c14e" stroke-width="1"/><circle cx="60" cy="60" r="40.8" fill="none" stroke="#9a6412" stroke-width="1.2"/>
    ${["A", "K", "Q", "J", "10"]
      .map(
        (r, i) =>
          `<g transform="rotate(${(i - 2) * 14} 60 150)"><rect x="53" y="92" width="14" height="20" rx="2" fill="#fff" stroke="#9a6412" stroke-width="1"/><text x="60" y="104" font-size="${r === "10" ? 6.5 : 8}" font-weight="800" text-anchor="middle" fill="#dc2626" font-family="${SANS}">${r}</text>${suitG("hearts", 60, 108, 5, "#dc2626")}</g>`,
      )
      .join("")}
    ${sparkle(18, 28, 0)}${sparkle(102, 34, 0.6)}${sparkle(100, 88, 1.2)}${sparkle(22, 86, 0.9)}`,
};

export const frameSvg = (key: FrameKey) => svg("-4 -4 128 128", FRAMES[key]);

// ---------- versos: viewBox 0 0 100 145 ----------

export const CARD_VB = "0 0 100 145";
const stripes = (a: string, b: string, w = 6) =>
  `<pattern id="st" width="${w * 2}" height="${w * 2}" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="${w}" height="${w * 2}" fill="${a}"/><rect x="${w}" width="${w}" height="${w * 2}" fill="${b}"/></pattern>`;
const inner = (fill: string) => `<rect x="6" y="6" width="88" height="133" rx="5" fill="${fill}"/>`;
const ring = `<circle cx="50" cy="72.5" r="22" fill="none" stroke="rgba(255,255,255,.25)" stroke-width="3"/>`;
const CHIP = `<circle cx="32" cy="32" r="31" fill="#f2c14e"/><circle cx="32" cy="32" r="26.5" fill="none" stroke="#9a6412" stroke-width="8" stroke-dasharray="10.4 10.4"/>
  <circle cx="32" cy="32" r="18" fill="#e3ab2f" stroke="#9a6412" stroke-width="2.5"/><path d="M32 21l3.2 6.6 7.3 1-5.3 5.1 1.3 7.2L32 37.5l-6.5 3.4 1.3-7.2-5.3-5.1 7.3-1z" fill="#fff4cf"/>`;
const STAR = "M50 52l5.5 12 13 1.5-9.7 8.8 2.7 12.9L50 80.6l-11.5 6.6 2.7-12.9-9.7-8.8 13-1.5z";

const BACKS: Record<DeckKey, string> = {
  classico: `${stripes("#9f1d2b", "#b8283a")}${inner("url(#st)")}${ring}`,
  azul: `${stripes("#1e3a8a", "#2c4fb3")}${inner("url(#st)")}${ring}`,
  feltro: `${stripes("#0f5132", "#0d4a2d", 3)}${inner("url(#st)")}<rect x="11" y="11" width="78" height="123" rx="3" fill="none" stroke="#f2c14e" stroke-width="1" stroke-dasharray="3 2.5"/>
    <g transform="translate(32 54.5) scale(.5625)">${CHIP}</g>`,
  xadrez: `<pattern id="ck" width="16" height="16" patternUnits="userSpaceOnUse"><rect width="16" height="16" fill="#1c1917"/><rect width="8" height="8" fill="#44403c"/><rect x="8" y="8" width="8" height="8" fill="#44403c"/></pattern>
    ${inner("url(#ck)")}<path d="M50 50 L68 72.5 L50 95 L32 72.5Z" fill="#dc2626" stroke="#fff" stroke-width="2"/>`,
  deco: `${inner("#111")}<clipPath id="dc"><rect x="6" y="6" width="88" height="133" rx="5"/></clipPath><g clip-path="url(#dc)" stroke="#f2c14e" stroke-width=".8" opacity=".85">${Array.from(
    { length: 13 },
    (_, i) => {
      const a = Math.PI * (i / 12);
      return `<line x1="50" y1="139" x2="${(50 - Math.cos(a) * 110).toFixed(2)}" y2="${(139 - Math.sin(a) * 110).toFixed(2)}"/>`;
    },
  ).join("")}</g>
    <rect x="10" y="10" width="80" height="125" rx="3" fill="none" stroke="#f2c14e" stroke-width="1.5"/><rect x="13" y="13" width="74" height="119" rx="2" fill="none" stroke="#f2c14e" stroke-width=".6"/>
    <path d="M50 52 L64 72.5 L50 93 L36 72.5Z" fill="#111" stroke="#f2c14e" stroke-width="2"/><path d="M50 62 L57 72.5 L50 83 L43 72.5Z" fill="#f2c14e"/>`,
  naipes: `<pattern id="np" width="22" height="22" patternUnits="userSpaceOnUse"><rect width="22" height="22" fill="#f5efe0"/>
      ${suitG("spades", 5.5, 6, 7, "#1c1917")}${suitG("hearts", 16.5, 6, 7, "#c2261c")}${suitG("diamonds", 5.5, 17, 7, "#c2261c")}${suitG("clubs", 16.5, 17, 7, "#1c1917")}</pattern>
    ${inner("url(#np)")}<rect x="6" y="6" width="88" height="133" rx="5" fill="none" stroke="#c2261c" stroke-width="2"/>`,
  retro: `<pattern id="rt" width="100" height="24" patternUnits="userSpaceOnUse"><rect width="100" height="24" fill="#f5e6c8"/><rect y="4" width="100" height="5" fill="#e76f2a"/><rect y="11" width="100" height="5" fill="#d9a521"/><rect y="18" width="100" height="5" fill="#1f7a72"/></pattern>
    ${inner("url(#rt)")}<circle cx="50" cy="72.5" r="20" fill="#f5e6c8" stroke="#1f7a72" stroke-width="3"/><text x="50" y="80.5" font-size="21" text-anchor="middle" fill="#e76f2a" font-family="${DISPLAY}">M</text>`,
  noite: `<linearGradient id="ng" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0b1437"/><stop offset="1" stop-color="#312e81"/></linearGradient>
    ${inner("url(#ng)")}
    ${[[20, 22], [72, 18], [84, 50], [28, 60], [60, 40], [16, 110], [80, 120], [45, 128], [70, 95], [34, 88], [88, 82], [52, 16]]
      .map(
        ([x, y], i) =>
          `<circle cx="${x}" cy="${y}" r="${i % 3 ? 1 : 1.6}" fill="#fff"><animate attributeName="opacity" values="1;.2;1" dur="${2 + (i % 4) * 0.6}s" begin="${(i * 0.3).toFixed(1)}s" repeatCount="indefinite"/></circle>`,
      )
      .join("")}
    <circle cx="50" cy="72.5" r="16" fill="#fef3c7"/><circle cx="57" cy="66" r="14" fill="#1f2462"/>
    <rect x="10" y="10" width="80" height="125" rx="3" fill="none" stroke="#a5b4fc" stroke-width=".8" opacity=".6"/>`,
  neon: `<pattern id="nl" width="16" height="16" patternUnits="userSpaceOnUse"><path d="M8 0L16 8 8 16 0 8Z" fill="none" stroke="#22d3ee" stroke-width=".8" opacity=".35"/></pattern>
    ${glow("nf", 2)}${inner("#0b1020")}${inner("url(#nl)")}
    <g filter="url(#nf)" fill="none"><path d="M50 44L72 72.5 50 101 28 72.5Z" stroke="#22d3ee" stroke-width="2.5">${pulse}</path><path d="M50 56L62 72.5 50 89 38 72.5Z" stroke="#f472b6" stroke-width="2"/>
    <rect x="10" y="10" width="80" height="125" rx="3" stroke="#e879f9" stroke-width="1.2"/></g>`,
  holo: `${holoGradient("hg")}${inner("url(#hg)")}${shine(6, 6, 88, 133, 5)}
    <path d="${STAR}" fill="#fff" opacity=".9"/>
    <rect x="11" y="11" width="78" height="123" rx="3" fill="none" stroke="#fff" stroke-width="1" opacity=".7"/>`,
  ouro: `<linearGradient id="og" x1="0" y1="0" x2="1" y2="1">${GOLD_STOPS}</linearGradient>
    ${inner("url(#og)")}${shine(6, 6, 88, 133, 5)}
    <rect x="10" y="10" width="80" height="125" rx="3" fill="none" stroke="#9a6412" stroke-width="1.5"/><rect x="13" y="13" width="74" height="119" rx="2" fill="none" stroke="#9a6412" stroke-width=".6"/>
    <path d="M50 48L68 72.5 50 97 32 72.5Z" fill="#1c1407"/><path d="M50 61l3.2 6.6 7.3 1-5.3 5.1 1.3 7.2L50 77.5l-6.5 3.4 1.3-7.2-5.3-5.1 7.3-1z" fill="#f2c14e"/>`,
};

export const backSvg = (key: DeckKey) => svg(CARD_VB, `<rect x="1" y="1" width="98" height="143" rx="8" fill="#fff"/>${BACKS[key]}`);

// ---------- frentes: um molde só, as 52 cartas de cada baralho saem dele ----------

const BLACK_RED = (b: string, r: string): Record<SuitName, string> => ({ spades: b, clubs: b, hearts: r, diamonds: r });
const frame = (inset: number, color: string, w = 1, extra = "") =>
  `<rect x="${inset}" y="${inset}" width="${100 - inset * 2}" height="${145 - inset * 2}" rx="${Math.max(2, 8 - inset)}" fill="none" stroke="${color}" stroke-width="${w}" ${extra}/>`;

interface FaceStyle {
  /** cor de fundo (também usada na face compacta do Spider) */
  bg: string;
  /** fundo com degradê (no lugar de `bg` no SVG) */
  bgDef?: string;
  edge: string;
  col: Record<SuitName, string>;
  font: string;
  weight: number;
  idx: number;
  glow?: boolean;
  shine?: boolean;
  extra?: string;
}

const FACES: Record<DeckKey, FaceStyle> = {
  classico: { bg: "#fff", edge: "#d6d3d1", col: BLACK_RED("#111", "#c2261c"), font: SERIF, weight: 700, idx: 20 },
  azul: { bg: "#fff", edge: "#1e3a8a", col: BLACK_RED("#1e3a8a", "#c2261c"), font: SERIF, weight: 700, idx: 20, extra: frame(5, "#2c4fb3") },
  feltro: { bg: "#fbf7ec", edge: "#0f5132", col: BLACK_RED("#0f5132", "#b91c1c"), font: SERIF, weight: 700, idx: 20, extra: frame(5, "#d4961f", 1, 'stroke-dasharray="3 2.5"') },
  xadrez: {
    bg: "#fff",
    edge: "#1c1917",
    col: BLACK_RED("#1c1917", "#dc2626"),
    font: SANS,
    weight: 800,
    idx: 20,
    extra: `<pattern id="xk" width="6" height="6" patternUnits="userSpaceOnUse"><rect width="6" height="6" fill="#fff"/><rect width="3" height="3" fill="#1c1917"/><rect x="3" y="3" width="3" height="3" fill="#1c1917"/></pattern>
      <rect x="35" y="6" width="30" height="6" fill="url(#xk)"/><rect x="35" y="133" width="30" height="6" fill="url(#xk)"/>`,
  },
  naipes: { bg: "#f5efe0", edge: "#c2261c", col: BLACK_RED("#1c1917", "#c2261c"), font: SERIF, weight: 700, idx: 20, extra: frame(5, "#c2261c", 1.5) },
  retro: { bg: "#f5e6c8", edge: "#1f7a72", col: BLACK_RED("#1f7a72", "#e76f2a"), font: DISPLAY, weight: 400, idx: 18, extra: frame(5.5, "#d9a521", 1.5, 'stroke-dasharray="6 3"') },
  deco: { bg: "#111", edge: "#f2c14e", col: BLACK_RED("#f2c14e", "#ef4444"), font: DIDONE, weight: 700, idx: 22, extra: frame(5, "#f2c14e") + frame(7.5, "#f2c14e", 0.5) },
  noite: {
    bg: "#1a2160",
    bgDef: `<linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0b1437"/><stop offset="1" stop-color="#312e81"/></linearGradient>`,
    edge: "#a5b4fc",
    col: BLACK_RED("#fef3c7", "#fb7185"),
    font: SANS,
    weight: 800,
    idx: 20,
    extra: [[38, 14], [66, 22], [84, 44], [16, 98], [62, 128], [30, 120], [80, 104]]
      .map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="${i % 2 ? 0.8 : 1.2}" fill="#fff" opacity=".8"/>`)
      .join(""),
  },
  neon: { bg: "#0b1020", edge: "#22d3ee", col: BLACK_RED("#22d3ee", "#f472b6"), font: SANS, weight: 800, idx: 20, glow: true, extra: frame(5, "#e879f9", 1, 'opacity=".6"') },
  holo: { bg: "#fff", edge: "#c4b5fd", col: BLACK_RED("#312e81", "#db2777"), font: SANS, weight: 800, idx: 20, shine: true, extra: `${holoGradient("hx")}${frame(4.5, "url(#hx)", 4)}` },
  ouro: {
    bg: "#f2c14e",
    bgDef: `<linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">${GOLD_STOPS}</linearGradient>`,
    edge: "#9a6412",
    col: BLACK_RED("#1c1407", "#7f1d1d"),
    font: DIDONE,
    weight: 700,
    idx: 22,
    shine: true,
    extra: frame(5, "#9a6412"),
  },
};

/** Cores de cada baralho para quem desenha carta sem o SVG (face compacta do Spider). */
export function deckPalette(key: DeckKey) {
  const f = FACES[key];
  return { bg: f.bg, edge: f.edge, black: f.col.spades, red: f.col.hearts };
}

export function faceSvg(key: DeckKey, rank: string, suit: SuitName): string {
  const s = FACES[key];
  const c = s.col[suit];
  const fx = s.glow ? ` filter="url(#fg)"` : "";
  const defs = (s.bgDef ?? "") + (s.glow ? glow("fg", 1.6) : "");
  const n = s.idx;
  const cx = 8 + n * 0.3;
  const size = rank === "10" ? n * 0.85 : n;
  const corner = `<g${fx}><text x="${cx}" y="${5 + n * 0.85}" font-size="${size}" font-family="${s.font}" font-weight="${s.weight}" text-anchor="middle" fill="${c}" letter-spacing="${rank === "10" ? -1 : 0}">${rank}</text>${suitG(suit, cx, 9 + n * 1.2, n * 0.6, c)}</g>`;
  let mid: string;
  if (rank === "A") mid = suitG(suit, 50, 72.5, 48, c);
  else if ("JQK".includes(rank))
    mid = `<rect x="27" y="37" width="46" height="71" rx="4" fill="none" stroke="${c}" stroke-width="1.5" opacity=".55"/>
    <text x="50" y="82" font-size="38" font-family="${s.font}" font-weight="${s.weight}" text-anchor="middle" fill="${c}">${rank}</text>${suitG(suit, 50, 96, 13, c)}`;
  else mid = suitG(suit, 50, 72.5, 36, c);
  return svg(
    CARD_VB,
    `${defs}<rect x="1" y="1" width="98" height="143" rx="8" fill="${s.bgDef ? "url(#bg)" : s.bg}" stroke="${s.edge}" stroke-width="2"/>${s.extra ?? ""}
    ${corner}<g transform="rotate(180 50 72.5)">${corner}</g><g${fx}>${mid}</g>${s.shine ? shine(1, 1, 98, 143, 8) : ""}`,
  );
}

// ---------- nomes dos arquivos (os mesmos das PNG do clássico em public/cards) ----------

export const SUITS: readonly SuitName[] = ["spades", "hearts", "diamonds", "clubs"];
const FILE_RANKS = ["ace", "2", "3", "4", "5", "6", "7", "8", "9", "10", "jack", "queen", "king"] as const;
const RANK_OF_FILE: Record<string, string> = { ace: "A", jack: "J", queen: "Q", king: "K" };

/** "king_of_hearts" -> { rank: "K", suit: "hearts" }; nome que não existe -> null. */
export function parseCardFile(name: string): { rank: string; suit: SuitName } | null {
  const m = /^(\w+)_of_(\w+)$/.exec(name);
  if (!m || !(FILE_RANKS as readonly string[]).includes(m[1]) || !(SUITS as readonly string[]).includes(m[2])) return null;
  return { rank: RANK_OF_FILE[m[1]] ?? m[1], suit: m[2] as SuitName };
}

/** Os 52 nomes de arquivo de um baralho. */
export const CARD_FILES = FILE_RANKS.flatMap((r) => SUITS.map((s) => `${r}_of_${s}`));

export { DECK_KEYS, FRAME_KEYS };
