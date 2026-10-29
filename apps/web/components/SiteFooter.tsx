import Link from "next/link";
import { ABOUT_PATH, CONTACT_PATH, INSTALL_PATH, PRIVACY_PATH, TERMS_PATH } from "@/lib/legal";
import { DAILY_SEO, GAMES, SITE_NAME } from "@/lib/seo";
import { AdSlot } from "@/components/AdSlot";

/** O ícone do site (app/icon.svg) sem o fundo escuro: feltro, borda dourada e a carta de espadas. */
function SiteIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="6 6 52 52" aria-hidden="true" className={className}>
      <rect x="8" y="8" width="48" height="48" rx="10" fill="#14452b" />
      <g transform="translate(32 33) rotate(-12)">
        <rect x="-13" y="-19" width="26" height="38" rx="4" fill="#fffdf6" />
        <path
          d="M0 -10 C 9 -2 10 4 5 7 C 3.500 8 1.500 7.500 0.800 6 L 2 13 H -2 L -0.800 6 C -1.500 7.500 -3.500 8 -5 7 C -10 4 -9 -2 0 -10 Z"
          fill="#14181a"
        />
      </g>
      <rect x="8" y="8" width="48" height="48" rx="10" fill="none" stroke="#f5b942" strokeWidth="3" />
    </svg>
  );
}

const DAILY = GAMES.filter((g) => g.slug in DAILY_SEO);

// Jogos agrupados por tipo; jogo novo que não estiver aqui cai em "Casuais". O "Como jogar" fica na página de cada jogo.
const GROUPS: { title: string; slugs: string[] }[] = [
  { title: "CARTAS", slugs: ["truco-paulista", "buraco", "blackjack", "paciencia-spider"] },
  { title: "TABULEIRO", slugs: ["xadrez", "damas", "ludo", "domino", "mahjong", "batalha-naval", "connect-4"] },
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

/** Rodapé das páginas de conteúdo (home, Como jogar, Sobre, Contato, Privacidade, Termos): anúncio, links e o nome do site enorme, cortado embaixo. */
export function SiteFooter() {
  return (
    <>
    <AdSlot className="mt-16 px-4" />
    <footer className="mt-16 overflow-hidden border-t border-white/10">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 pt-12 sm:px-6 xl:grid-cols-[auto_1fr] xl:gap-16">
        <div className="flex flex-col items-start gap-6">
          <SiteIcon className="h-28 w-28 sm:h-32 sm:w-32" />
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-white/40">
            <span>
              © {new Date().getFullYear()} {SITE_NAME}
            </span>
            <Link href={ABOUT_PATH} className="transition hover:text-gold">
              Sobre
            </Link>
            <Link href="/blog" className="transition hover:text-gold">
              Blog
            </Link>
            <Link href={INSTALL_PATH} className="transition hover:text-gold">
              Instalar o app
            </Link>
            <Link href={CONTACT_PATH} className="transition hover:text-gold">
              Contato
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
