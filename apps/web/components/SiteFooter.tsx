import { Fragment } from "react";
import Link from "next/link";
import { PRIVACY_PATH, TERMS_PATH } from "@/lib/legal";
import { DAILY_SEO, GAMES, SITE_NAME } from "@/lib/seo";
import { AdSlot } from "@/components/AdSlot";

// app/icon.svg em ASCII (26 linhas, para fontes com caractere de largura 0,6 da altura, como a Courier New): # borda, . feltro, @ carta, espaço = espada.
// Gerado rasterizando o SVG; ao mudar o ícone, gere de novo.
const ICON = [
  "       #############################",
  "    ###################################",
  "  ####...............................####",
  " ###....................@@@@...........###",
  " ##..............@@@@@@@@@@@@...........##",
  "###.......@@@@@@@@@@@@@@@@@@@@..........###",
  "###......@@@@@@@@@@@@@@@@@@@@@..........###",
  "###.....@@@@@@@@@@@@@@@@@@@@@@..........###",
  "###......@@@@@@@@@@@@@@@@@@@@@@.........###",
  "###......@@@@@@@@@@   @@@@@@@@@.........###",
  "###......@@@@@@@@@      @@@@@@@.........###",
  "###.......@@@@@@@         @@@@@@........###",
  "###.......@@@@@@           @@@@@........###",
  "###........@@@@@            @@@@........###",
  "###........@@@@             @@@@@.......###",
  "###........@@@@@            @@@@@.......###",
  "###.........@@@@           @@@@@@@......###",
  "###.........@@@@@@@ @@  @@@@@@@@@@......###",
  "###.........@@@@@@@@@@   @@@@@@@@@......###",
  "###..........@@@@@@@@@   @@@@@@@@@@.....###",
  "###..........@@@@@@@@@@@@@@@@@@@@@@.....###",
  " ##..........@@@@@@@@@@@@@@@@@@@@.......##",
  " ###..........@@@@@@@@@@@@@@...........###",
  "  ####.........@@@@@.................####",
  "    ###################################",
  "       #############################",
];

const CHAR_COLOR: Record<string, string> = { "#": "text-gold", ".": "text-emerald-700/80", "@": "text-[#fffdf6]" };

/** Cada linha vira trechos do mesmo caractere, cada um com a sua cor. */
function AsciiIcon({ className = "" }: { className?: string }) {
  return (
    <pre aria-hidden="true" className={`select-none font-['Courier_New',Courier,monospace] leading-none ${className}`}>
      {ICON.map((row, i) => (
        <Fragment key={i}>
          {row.match(/(.)\1*/g)?.map((run, j) => (
            <span key={j} className={CHAR_COLOR[run[0]]}>
              {run}
            </span>
          ))}
          {"\n"}
        </Fragment>
      ))}
    </pre>
  );
}

const DAILY = GAMES.filter((g) => g.slug in DAILY_SEO);

// Jogos agrupados por tipo; jogo novo que não estiver aqui cai em "Casuais". O "Como jogar" fica na página de cada jogo.
const GROUPS: { title: string; slugs: string[] }[] = [
  { title: "CARTAS", slugs: ["truco-paulista", "buraco", "blackjack", "paciencia-spider"] },
  { title: "TABULEIRO", slugs: ["xadrez", "damas", "ludo", "domino", "batalha-naval", "connect-4"] },
  { title: "PALAVRAS", slugs: ["stop", "codenames", "verbete", "quente-ou-frio", "caca-palavras"] },
];
const GROUPED = new Set(GROUPS.flatMap((g) => g.slugs));
const COLUMNS = [
  ...GROUPS.map((g) => ({ title: g.title, games: g.slugs.flatMap((s) => GAMES.filter((x) => x.slug === s)) })),
  { title: "CASUAIS", games: GAMES.filter((g) => !GROUPED.has(g.slug)) },
];

function Column({ title, links }: { title: string; links: { href: string; label: string }[] }) {
  return (
    <div className="flex flex-col gap-3">
      <h2 className="font-display text-xs tracking-[0.2em] text-white/35">{title}</h2>
      <ul className="flex flex-col gap-2 whitespace-nowrap text-sm text-white/60">
        {links.map((l) => (
          <li key={l.href}>
            <Link href={l.href} className="transition hover:text-gold">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Rodapé das páginas de conteúdo (home, Como jogar, Privacidade, Termos): anúncio, links e o nome do site enorme, cortado embaixo. */
export function SiteFooter() {
  return (
    <>
    <AdSlot className="mt-16 px-4" />
    <footer className="mt-16 overflow-hidden border-t border-white/10">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 pt-12 sm:px-6 xl:grid-cols-[auto_1fr] xl:gap-16">
        <div className="flex flex-col items-start gap-6">
          <AsciiIcon className="text-[5px] sm:text-[6px]" />
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-white/40">
            <span>
              © {new Date().getFullYear()} {SITE_NAME}
            </span>
            <Link href="/blog" className="transition hover:text-gold">
              Blog
            </Link>
            <Link href={PRIVACY_PATH} className="transition hover:text-gold">
              Privacidade
            </Link>
            <Link href={TERMS_PATH} className="transition hover:text-gold">
              Termos de uso
            </Link>
          </div>
        </div>

        <nav aria-label="Rodapé" className="grid grid-cols-2 gap-8 sm:grid-cols-3 md:grid-cols-5 xl:justify-self-end xl:gap-10">
          {COLUMNS.map((c) => (
            <Column key={c.title} title={c.title} links={c.games.map((g) => ({ href: g.path, label: g.name }))} />
          ))}
          <Column title="DIÁRIO" links={DAILY.map((g) => ({ href: `${g.path}/diario`, label: g.name }))} />
        </nav>
      </div>

      {/* nome do site na largura toda; a parte de baixo das letras fica para fora */}
      <div aria-hidden="true" className="mx-auto mt-16 max-w-6xl px-4 sm:px-6">
        <svg viewBox="0 0 1000 84" className="block w-full text-gold">
          <text x="0" y="93" textLength="1000" lengthAdjust="spacingAndGlyphs" fontSize="121" fill="currentColor" className="font-display">
            MESA DE JOGOS
          </text>
        </svg>
      </div>
    </footer>
    </>
  );
}
