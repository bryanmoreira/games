import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Block, LegalPage } from "@/components/legal/LegalPage";
import { JsonLd } from "@/components/seo";
import { INSTALL_PATH } from "@/lib/legal";
import { SITE_NAME, SITE_URL } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Instalar no celular ou no PC",
  description: `Como instalar o ${SITE_NAME} no iPhone, no Android e no computador. Grátis, sem loja de aplicativos e sem ocupar espaço.`,
  alternates: { canonical: INSTALL_PATH },
};

const FAQ = [
  { q: "É grátis?", a: "Sim. Instalar e jogar não custa nada, e não precisa de loja de aplicativos nem de cadastro." },
  { q: "Ocupa espaço no celular?", a: "Quase nada. O Mesa instalado é o próprio site com um ícone na tela, então não baixa um aplicativo pesado." },
  { q: "Preciso de internet para jogar?", a: "Sim. Os jogos e as salas online rodam no servidor, então é preciso estar conectado." },
  { q: "Como desinstalar?", a: "Como qualquer app: no celular, segure o ícone e remova. No computador, abra o app instalado, clique nos três pontos da janela e escolha Desinstalar." },
  { q: "Por que não aparece o botão Instalar?", a: "O botão só aparece em navegadores que permitem a instalação (Chrome e Edge). No iPhone use o Safari e, no Firefox do computador, não dá para instalar." },
];

const ld = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "HowTo",
      name: `Como instalar o ${SITE_NAME} no celular ou no computador`,
      step: [
        { "@type": "HowToStep", name: "iPhone", text: "No Safari, toque em Compartilhar e em Adicionar à Tela de Início." },
        { "@type": "HowToStep", name: "Android", text: "No Chrome, toque nos três pontos e em Instalar app." },
        { "@type": "HowToStep", name: "Computador", text: "No Chrome ou no Edge, clique no ícone de instalar na barra de endereço." },
      ],
    },
    {
      "@type": "FAQPage",
      mainEntity: FAQ.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
    },
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: SITE_NAME, item: SITE_URL },
        { "@type": "ListItem", position: 2, name: "Instalar", item: `${SITE_URL}${INSTALL_PATH}` },
      ],
    },
  ],
};

const stroke = { fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" } as const;

/** Um passo: desenho pequeno, número e a instrução. */
function Step({ n, icon, children }: { n: number; icon: ReactNode; children: ReactNode }) {
  return (
    <li className="flex list-none items-center gap-3">
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-black/30 text-gold ring-1 ring-white/10">
        <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" {...stroke}>
          {icon}
        </svg>
      </span>
      <span>
        <b className="mr-1 text-gold">{n}.</b>
        {children}
      </span>
    </li>
  );
}

const SHARE = <path d="M12 3v12M8 7l4-4 4 4M5 12v8h14v-8" />;
const PLUS = <path d="M5 4h14v16H5zM12 8v8M8 12h8" />;
const DOTS = (
  <>
    <circle cx="12" cy="5" r="1.2" />
    <circle cx="12" cy="12" r="1.2" />
    <circle cx="12" cy="19" r="1.2" />
  </>
);
const DOWN = <path d="M12 4v11M7 11l5 5 5-5M5 20h14" />;
const CHECK = <path d="M5 13l4 4 10-10" />;
const SCREEN = <path d="M3 5h18v11H3zM8 20h8M12 16v4M9 10l2 2 4-4" />;
const BROWSER = <path d="M3 5h18v14H3zM3 9h18M7 7h.01M10 7h.01" />;

export default function InstallPage() {
  return (
    <LegalPage title="INSTALAR" dated={false}>
      <JsonLd data={ld} />
      <p className="text-center text-sm text-white/70">
        O {SITE_NAME} vira um ícone na tela do celular ou do computador e abre em tela cheia, como um app. Grátis, sem loja e sem ocupar espaço.
      </p>

      <Block title="iPhone e iPad">
        <ul className="!pl-0">
          <Step n={1} icon={BROWSER}>
            Abra o <b>mesadejogos.com</b> no <b>Safari</b>.
          </Step>
          <Step n={2} icon={SHARE}>
            Toque em <b>Compartilhar</b>, o quadrado com a seta para cima.
          </Step>
          <Step n={3} icon={PLUS}>
            Escolha <b>Adicionar à Tela de Início</b>.
          </Step>
          <Step n={4} icon={CHECK}>
            Toque em <b>Adicionar</b>. O ícone aparece com os seus apps.
          </Step>
        </ul>
        <p className="text-xs text-white/50">No iPhone só funciona pelo Safari; em outros navegadores a opção não aparece.</p>
      </Block>

      <Block title="Android">
        <ul className="!pl-0">
          <Step n={1} icon={BROWSER}>
            Abra o <b>mesadejogos.com</b> no <b>Chrome</b>.
          </Step>
          <Step n={2} icon={DOTS}>
            Toque nos <b>três pontinhos</b> no canto de cima.
          </Step>
          <Step n={3} icon={DOWN}>
            Escolha <b>Instalar app</b> (ou Adicionar à tela inicial).
          </Step>
          <Step n={4} icon={CHECK}>
            Confirme. Se aparecer o botão <b>Instalar</b> na página inicial, ele faz o mesmo.
          </Step>
        </ul>
      </Block>

      <Block title="Computador">
        <ul className="!pl-0">
          <Step n={1} icon={BROWSER}>
            Abra o <b>mesadejogos.com</b> no <b>Chrome</b> ou no <b>Edge</b>.
          </Step>
          <Step n={2} icon={SCREEN}>
            Clique no <b>ícone de instalar</b> no fim da barra de endereço, ou no botão Instalar da página inicial.
          </Step>
          <Step n={3} icon={CHECK}>
            Confirme. O Mesa abre numa janela própria e ganha atalho no menu Iniciar e na área de trabalho.
          </Step>
        </ul>
        <p className="text-xs text-white/50">No Safari do Mac, use Arquivo → Adicionar ao Dock. O Firefox do computador não instala sites.</p>
      </Block>

      <Block title="Perguntas frequentes">
        <div className="flex flex-col gap-2">
          {FAQ.map((f) => (
            <details key={f.q} className="rounded-xl bg-black/30 px-4 py-3">
              <summary className="cursor-pointer list-none font-semibold text-white/90 marker:hidden">{f.q}</summary>
              <p className="mt-2">{f.a}</p>
            </details>
          ))}
        </div>
      </Block>
    </LegalPage>
  );
}
