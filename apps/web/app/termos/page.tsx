import type { Metadata } from "next";
import Link from "next/link";
import { Block, Email, LegalPage } from "@/components/legal/LegalPage";
import { LEGAL_OWNER, PRIVACY_PATH, TERMS_PATH } from "@/lib/legal";
import { SITE_NAME } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Termos de Uso",
  description: `Regras para usar o ${SITE_NAME}: conta, conduta nas salas, o que não é permitido e os limites do serviço.`,
  alternates: { canonical: TERMS_PATH },
};

const link = "text-gold underline-offset-4 hover:underline";

export default function TermsPage() {
  return (
    <LegalPage title="TERMOS DE USO">
      <Block title="O acordo">
        <p>
          Estes termos valem para quem usa o {SITE_NAME} (mesadejogos.com), mantido por <b>{LEGAL_OWNER}</b>. Ao jogar ou criar uma conta, você
          concorda com eles e com a{" "}
          <Link href={PRIVACY_PATH} className={link}>
            Política de Privacidade
          </Link>
          . Se não concordar, não use o site.
        </p>
      </Block>

      <Block title="O serviço">
        <p>
          O {SITE_NAME} oferece jogos de cartas e de mesa para jogar sozinho, contra o computador ou com amigos. É <b>grátis</b>. Não há apostas,
          prêmios em dinheiro nem compras dentro do site.
        </p>
      </Block>

      <Block title="Sua conta">
        <ul>
          <li>A conta é opcional e é criada com o Google ou o Discord. Para isso, você precisa ter pelo menos 13 anos.</li>
          <li>Se você tem menos de 18 anos, use o site com o conhecimento dos seus pais ou responsáveis.</li>
          <li>A conta é pessoal. Você responde pelo que é feito nela; cuide do acesso à sua conta Google ou Discord.</li>
          <li>O @usuário não pode imitar outra pessoa nem ser ofensivo. Podemos trocá-lo se for.</li>
          <li>
            Você pode excluir a conta quando quiser em <b>Perfil &gt; Conta</b>.
          </li>
        </ul>
      </Block>

      <Block title="Conduta nas salas">
        <p>Jogue limpo e trate bem os outros jogadores. Não é permitido:</p>
        <ul>
          <li>usar nomes, respostas ou dicas com ofensas, assédio, discriminação, conteúdo sexual ou ameaças;</li>
          <li>divulgar dados pessoais de outras pessoas;</li>
          <li>trapacear, usar robôs ou programas que joguem por você nas partidas online, ou explorar falhas do site;</li>
          <li>tentar invadir, sobrecarregar ou atrapalhar o site e os servidores;</li>
          <li>usar o site para spam, golpes ou qualquer coisa ilegal.</li>
        </ul>
        <p>
          O que você escreve nas partidas é responsabilidade sua. Ao escrever, você permite que o site mostre esse conteúdo aos jogadores da sala
          durante a partida.
        </p>
      </Block>

      <Block title="Quando alguém quebra as regras">
        <p>
          Podemos remover nomes, anular resultados e conquistas obtidos com trapaça, e suspender ou excluir contas que desrespeitem estes termos,
          avisando quando possível. Viu algo errado? Escreva para <Email />.
        </p>
      </Block>

      <Block title="Propriedade">
        <p>
          O código, o visual e os textos do site pertencem ao {SITE_NAME}. Os jogos tradicionais (truco, paciência, sudoku, batalha naval e
          outros) são de domínio público; nomes de jogos e marcas de terceiros pertencem aos seus donos e são usados só para identificar o tipo
          de jogo. As imagens das cartas vêm de um projeto aberto, sob licença MIT.
        </p>
      </Block>

      <Block title="Limites do serviço">
        <ul>
          <li>
            O site é oferecido como está. Ele pode ficar fora do ar, mudar ou deixar de ter algum jogo, e partidas em andamento podem se perder (por
            exemplo, quando o servidor reinicia).
          </li>
          <li>Estatísticas e conquistas podem ser corrigidas se houver erro ou trapaça.</li>
          <li>
            Por ser um serviço gratuito, e no limite permitido pela lei, não respondemos por prejuízos indiretos causados por falhas ou
            indisponibilidade. Nada aqui tira direitos que a lei garante a você.
          </li>
        </ul>
      </Block>

      <Block title="Mudanças nestes termos">
        <p>
          Podemos atualizar estes termos. A data no topo da página muda junto e, se a mudança for importante, avisaremos no site antes de ela
          valer. Continuar usando o site depois disso significa aceitar a nova versão.
        </p>
      </Block>

      <Block title="Lei aplicável">
        <p>
          Estes termos seguem as leis do Brasil. Qualquer disputa pode ser levada ao foro do seu domicílio. Antes disso, fale com a gente em{" "}
          <Email />: quase tudo se resolve por e-mail.
        </p>
      </Block>
    </LegalPage>
  );
}
