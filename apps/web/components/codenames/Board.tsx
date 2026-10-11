import type { Key, Team } from "@truco/codenames";
import { Icon } from "@/components/ui/buttons";

/** Cores e nomes dos times (vermelho = 0, azul = 1). */
export const TEAM = [
  {
    name: "VERMELHO",
    text: "text-cn-red",
    bg: "bg-cn-red",
    ring: "ring-cn-red",
    border: "border-cn-red/50",
    soft: "bg-cn-red/15",
    shadow: "shadow-[0_4px_0_#8f241c]",
  },
  {
    name: "AZUL",
    text: "text-cn-blue",
    bg: "bg-cn-blue",
    ring: "ring-cn-blue",
    border: "border-cn-blue/50",
    soft: "bg-cn-blue/15",
    shadow: "shadow-[0_4px_0_#1c4590]",
  },
] as const;

type P = { className?: string };

/** Mestre: o olho que vê o mapa. */
export function EyeIcon({ className }: P) {
  return (
    <Icon className={className}>
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
    </Icon>
  );
}

/** Agente: chapéu e gola levantada. */
export function AgentIcon({ className }: P) {
  return (
    <Icon className={className}>
      <path d="M4 10h16" />
      <path d="M7 10l1.2-5.2A1 1 0 0 1 9.2 4h5.6a1 1 0 0 1 1 .8L17 10" />
      <path d="M8.5 13.5a3.5 3.5 0 0 0 7 0" />
      <path d="M5 21a7 7 0 0 1 14 0" />
    </Icon>
  );
}

export function SkullIcon({ className }: P) {
  return (
    <Icon className={className}>
      <path d="M12 3a8 8 0 0 0-5 14.2V20a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-2.8A8 8 0 0 0 12 3Z" />
      <circle cx="9" cy="12" r="1.5" />
      <circle cx="15" cy="12" r="1.5" />
      <path d="M10 21v-2" />
      <path d="M14 21v-2" />
    </Icon>
  );
}

/** Civil: pessoa comum. */
export function CivilIcon({ className }: P) {
  return (
    <Icon className={className}>
      <circle cx="12" cy="8" r="4" />
      <path d="M5 21a7 7 0 0 1 14 0" />
    </Icon>
  );
}

export function SendIcon({ className }: P) {
  return (
    <Icon className={className}>
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </Icon>
  );
}

/** Fundo da palavra revelada e da cor no mapa do mestre. */
const REVEALED: Record<string, string> = {
  0: "bg-cn-red text-white shadow-[0_3px_0_#8f241c]",
  1: "bg-cn-blue text-white shadow-[0_3px_0_#1c4590]",
  neutral: "bg-[#cbb98c] text-[#5b4a26] shadow-[0_3px_0_#8f7d52]",
  assassin: "bg-stone-950 text-white/80 shadow-[0_3px_0_#000] ring-1 ring-white/20",
};

/** Palavra coberta: bege; no mapa do mestre, tingida com a cor dela. */
const COVERED: Record<string, string> = {
  hidden: "bg-[#f3ead3] text-stone-800 shadow-[0_3px_0_#b8a77c]",
  0: "bg-[#f7d6cf] text-[#7d1d16] shadow-[0_3px_0_#c9584c] ring-2 ring-inset ring-cn-red",
  1: "bg-[#d4e1f8] text-[#173a78] shadow-[0_3px_0_#5079c4] ring-2 ring-inset ring-cn-blue",
  neutral: "bg-[#f3ead3] text-stone-800 shadow-[0_3px_0_#b8a77c]",
  assassin: "bg-stone-800 text-white shadow-[0_3px_0_#0c0a09] ring-2 ring-inset ring-stone-950",
};

export function KeyIcon({ k, className }: { k: Key; className?: string }) {
  if (k === "assassin") return <SkullIcon className={className} />;
  if (k === "neutral") return <CivilIcon className={className} />;
  return <AgentIcon className={className} />;
}

/** Tamanho da letra que cabe no cartão (em relação à largura do próprio cartão, via container query). */
function fontSize(word: string) {
  const longest = Math.max(5, ...word.split(" ").map((w) => w.length));
  return `min(16cqw, ${(120 / longest).toFixed(1)}cqw, 20px)`;
}

export interface Mark {
  initial: string;
  team: Team;
  mine: boolean;
}

/** Cartão de palavra da mesa. `k` null = cor escondida. */
export function WordCard({
  word,
  k,
  revealed,
  selected,
  marks = [],
  onClick,
  flip,
  className = "",
  style,
}: {
  word: string;
  k: Key | null;
  revealed: boolean;
  selected?: boolean;
  marks?: Mark[];
  onClick?: () => void;
  /** Acabou de ser revelada: vira com animação. */
  flip?: boolean;
  className?: string;
  style?: React.CSSProperties;
}) {
  const look = revealed && k !== null ? REVEALED[String(k)] : COVERED[k === null ? "hidden" : String(k)];
  const Tag = onClick ? "button" : "div";
  return (
    <Tag
      onClick={onClick}
      style={style}
      className={`@container relative flex aspect-[3/2] w-full select-none items-center justify-center overflow-hidden rounded-[10%/15%] px-1 transition ${look} ${
        onClick ? "cursor-pointer hover:brightness-105 active:translate-y-0.5" : ""
      } ${selected ? "outline outline-[3px] outline-offset-2 outline-gold" : ""} ${flip ? "cn-flip" : ""} ${className}`}
    >
      {revealed && k !== null ? (
        <>
          <KeyIcon k={k} className="absolute h-[70%] w-[70%] opacity-25" />
          <span className="relative text-center font-extrabold uppercase leading-tight opacity-80" style={{ fontSize: `calc(${fontSize(word)} * 0.8)` }}>
            {word}
          </span>
        </>
      ) : (
        <span className="text-center font-extrabold uppercase leading-tight [overflow-wrap:anywhere]" style={{ fontSize: fontSize(word) }}>
          {word}
        </span>
      )}
      {marks.length > 0 && (
        <span className="absolute left-[4%] top-[6%] flex -space-x-1">
          {marks.slice(0, 3).map((m, i) => (
            <span
              key={i}
              className={`flex h-[min(22cqw,22px)] w-[min(22cqw,22px)] items-center justify-center rounded-full font-display text-[min(13cqw,12px)] leading-none text-white ring-2 ${
                m.mine ? "ring-gold" : "ring-white/80"
              } ${TEAM[m.team].bg}`}
            >
              {m.initial}
            </span>
          ))}
          {marks.length > 3 && <span className="pl-1.5 font-display text-[min(13cqw,12px)]">+{marks.length - 3}</span>}
        </span>
      )}
    </Tag>
  );
}

/** Logo/ilustração: grade 3×3 de cartões, alguns revelados. */
export function MiniGrid({ className = "" }: { className?: string }) {
  const cells: (Key | null)[] = [0, null, 1, null, "assassin", null, 1, "neutral", 0];
  return (
    <div className={`grid grid-cols-3 gap-[6%] ${className}`}>
      {cells.map((k, i) => (
        <span
          key={i}
          className={`flex aspect-[3/2] items-center justify-center rounded-[12%/18%] ${k === null ? COVERED.hidden : REVEALED[String(k)]}`}
        >
          {k === null ? <span className="h-[14%] w-[60%] rounded-full bg-stone-800/30" /> : <KeyIcon k={k} className="h-[65%] w-[65%] opacity-60" />}
        </span>
      ))}
    </div>
  );
}
