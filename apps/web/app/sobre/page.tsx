import type { Metadata } from "next";
import Link from "next/link";
import { Block, LegalPage } from "@/components/legal/LegalPage";
import { ABOUT_PATH, CONTACT_PATH, LEGAL_OWNER } from "@/lib/legal";
import { DAILY_SEO, GAMES, SITE_NAME } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Sobre",
  description: `O que é o ${SITE_NAME}, quem faz, como os jogos são feitos e como o site se mantém gratuito.`,
  alternates: { canonical: ABOUT_PATH },
};

const link = "text-gold underline-offset-4 hover:underline";

export default function AboutPage() {
  return (
    <LegalPage title="SOBRE" dated={false}>
      <Block title="O que é o Mesa de Jogos">
        <p>
          O {SITE_NAME} (mesadejogos.com) é um site brasileiro de jogos de cartas, de tabuleiro e de palavras para jogar no navegador, sozinho
          contra o computador ou online com os amigos. Hoje são <b>{GAMES.length} jogos</b>, do Truco Paulista e do Buraco ao Xadrez, à Sinuca e
          ao Verbete, todos grátis e sem precisar instalar nada.
        </p>
        <p>
          A ideia nasceu de uma vontade simples: juntar a turma para um truco ou um Stop sem pedir para ninguém baixar aplicativo, criar conta ou
          ver anúncio no meio da partida. Basta criar uma sala, mandar o link no WhatsApp e jogar.
        </p>
      </Block>

      <Block title="Quem faz">
        <p>
          O site é feito e mantido por <b>{LEGAL_OWNER}</b>, desenvolvedor brasileiro, e está no ar desde outubro de 2026. Cada jogo é
          programado do zero aqui: regras, inteligência artificial dos adversários, salas online e artes das cartas e tabuleiros.
        </p>
      </Block>

      <Block title="Como os jogos são feitos">
        <ul>
          <li>
            <b>Regras de verdade.</b> Cada jogo segue as regras mais jogadas no Brasil, como o truco paulista com manilha que vira, o buraco
            fechado e as damas brasileiras, e tem uma página de Como jogar explicando tudo com exemplos.
          </li>
          <li>
            <b>Adversários no computador.</b> Quase todos os jogos têm modo solo contra uma IA, muitas vezes em níveis de dificuldade, para treinar
            ou jogar quando não tem ninguém por perto.
          </li>
          <li>
            <b>Salas privadas.</b> Nos jogos em grupo, quem cria a sala recebe um código e um link. Lugares vazios podem ser ocupados pelo
            computador para a partida sair na hora.
          </li>
          <li>
            <b>Desafios diários.</b> {Object.keys(DAILY_SEO).length} jogos têm um desafio novo todo dia à meia-noite, igual para todos, com
            calendário para jogar os dias anteriores.
          </li>
        </ul>
        <p>
          O site é atualizado com frequência: jogos novos, ajustes nas regras e na IA a partir do que os jogadores contam, e textos no{" "}
          <Link href="/blog" className={link}>
            blog
          </Link>{" "}
          com dicas e estratégias.
        </p>
      </Block>

      <Block title="Como o site se mantém">
        <p>
          Jogar é e vai continuar grátis. Os custos de servidor são pagos com anúncios do Google AdSense, que aparecem só nas páginas fora das
          partidas, como a página inicial e as de regras. Durante o jogo não há anúncio. Criar conta é opcional e serve para guardar
          estatísticas, conquistas e amigos.
        </p>
      </Block>

      <Block title="Fale com a gente">
        <p>
          Achou um erro nas regras, tem ideia de jogo novo ou quer mandar uma sugestão? Veja a página de{" "}
          <Link href={CONTACT_PATH} className={link}>
            contato
          </Link>
          .
        </p>
      </Block>
    </LegalPage>
  );
}
