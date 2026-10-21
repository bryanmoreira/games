import type { Metadata } from "next";
import Link from "next/link";
import { Block, Email, LegalPage } from "@/components/legal/LegalPage";
import { LEGAL_OWNER, PRIVACY_PATH, TERMS_PATH } from "@/lib/legal";
import { SITE_NAME } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Política de Privacidade",
  description: `Quais dados o ${SITE_NAME} guarda, para quê, com quem compartilha e como apagar a sua conta.`,
  alternates: { canonical: PRIVACY_PATH },
};

export default function PrivacyPage() {
  return (
    <LegalPage title="PRIVACIDADE">
      <Block title="Quem cuida dos seus dados">
        <p>
          O {SITE_NAME} (mesadejogos.com) é mantido por <b>{LEGAL_OWNER}</b>, pessoa física, que é o controlador dos dados pessoais tratados
          aqui, nos termos da Lei Geral de Proteção de Dados (LGPD, Lei 13.709/2018). Para qualquer assunto sobre os seus dados, escreva para <Email />.
        </p>
        <p>
          Esta política vale junto com os{" "}
          <Link href={TERMS_PATH} className="text-gold underline-offset-4 hover:underline">
            Termos de uso
          </Link>
          .
        </p>
      </Block>

      <Block title="O que guardamos">
        <p>
          <b>Sem conta</b>, dá para jogar tudo. Nesse caso o site só recebe o nome que você digita para entrar nas salas e os dados técnicos de
          qualquer acesso (endereço IP, navegador, páginas abertas), usados para o site funcionar e se proteger de abuso.
        </p>
        <p>
          <b>Com conta</b> (entrando com Google ou Discord), guardamos também:
        </p>
        <ul>
          <li>nome, e-mail e foto que o provedor envia, e o identificador da sua conta nele;</li>
          <li>o @nome de usuário e se o seu perfil é público ou privado;</li>
          <li>as partidas que você termina (jogo, modo, resultado, tempo, pontos, jogadas), as conquistas e os desafios diários;</li>
          <li>amigos e convites de amizade;</li>
          <li>o último momento em que você estava com o site aberto, para os amigos verem quem está online;</li>
          <li>as sessões de login: data, endereço IP e navegador.</li>
        </ul>
        <p>
          Pedimos ao Google e ao Discord só os dados básicos do perfil e o e-mail. Não lemos seus contatos, mensagens ou servidores e nunca
          publicamos nada em seu nome.
        </p>
        <p>
          <b>Nas partidas online</b>, o que você faz e escreve (jogadas, respostas do Stop, dicas do Codenames) é visto pelos jogadores da sala e
          fica só na memória do servidor enquanto a sala existe. Não guardamos o conteúdo das partidas, só o resultado delas para quem tem conta.
        </p>
      </Block>

      <Block title="Para que usamos">
        <ul>
          <li>
            <b>Fazer o site funcionar</b>: login, salas, perfil, estatísticas, conquistas e amigos. É a execução do serviço que você pediu ao
            criar a conta (art. 7º, V, da LGPD).
          </li>
          <li>
            <b>Segurança</b>: evitar trapaça, abuso e ataques, e investigar problemas. Base: legítimo interesse (art. 7º, IX).
          </li>
          <li>
            <b>Melhorar o site</b>: contagem de visitas e páginas mais usadas, sem identificar você. Base: legítimo interesse.
          </li>
          <li>
            <b>Manter o site gratuito</b>: anúncios do Google AdSense nas páginas fora das partidas (início, páginas dos jogos e Como jogar).
            Nunca aparecem durante uma partida. Base: legítimo interesse (art. 7º, IX).
          </li>
          <li>
            <b>Cumprir a lei</b>, quando uma autoridade pedir com base legal (art. 7º, II).
          </li>
        </ul>
        <p>Não vendemos dados e não passamos os dados da sua conta (nome, e-mail, partidas) a anunciantes.</p>
      </Block>

      <Block title="O que os outros jogadores veem">
        <ul>
          <li>Nas salas: o seu nome, as suas jogadas e o que você escreve no jogo.</li>
          <li>
            No perfil público (o padrão): nome, foto, @usuário, estatísticas, conquistas e a rivalidade com quem já jogou com você. No perfil
            privado, as estatísticas ficam só para você e seus amigos; nome, foto e @usuário continuam visíveis.
          </li>
          <li>Seus amigos veem quando você está online.</li>
          <li>O seu e-mail nunca aparece para ninguém.</li>
        </ul>
      </Block>

      <Block title="Cookies e armazenamento no navegador">
        <p>
          Usamos <b>um único cookie</b>: o da sessão de login, que mantém você conectado por até 60 dias. Ele é essencial para a conta funcionar
          e por isso não pedimos consentimento para ele. Sem conta, ele não é criado.
        </p>
        <p>O site também guarda no próprio navegador (armazenamento local), sem enviar para nós:</p>
        <ul>
          <li>o nome que você usa nas salas;</li>
          <li>se o som está ligado ou desligado;</li>
          <li>os jogos em andamento do Sudoku, da Paciência Spider e dos desafios diários, para você continuar de onde parou.</li>
        </ul>
        <p>
          A contagem de visitas usa o <b>Umami</b>, que não usa cookies, não segue você por outros sites e não guarda o seu IP. Não usamos
          Google Analytics.
        </p>
        <p>
          Os <b>anúncios</b> são servidos pelo <b>Google AdSense</b>. O Google e os parceiros dele podem usar cookies e identificadores do
          navegador para mostrar anúncios com base nas suas visitas a este e a outros sites. Você pode desativar os anúncios personalizados em{" "}
          <a href="https://adssettings.google.com" target="_blank" rel="noopener noreferrer" className="text-gold underline-offset-4 hover:underline">
            Minha central de anúncios
          </a>{" "}
          e saber mais em{" "}
          <a href="https://policies.google.com/technologies/ads" target="_blank" rel="noopener noreferrer" className="text-gold underline-offset-4 hover:underline">
            Como o Google usa cookies em publicidade
          </a>
          .
        </p>
        <p>Para apagar tudo isso, limpe os dados do site nas configurações do seu navegador.</p>
      </Block>

      <Block title="Com quem compartilhamos">
        <ul>
          <li>
            <b>Google e Discord</b>, quando você entra com eles. Eles ficam sabendo que você usou o login no {SITE_NAME} e seguem as próprias
            políticas de privacidade.
          </li>
          <li>
            <b>Google AdSense</b>, nas páginas com anúncio: recebe os dados técnicos do acesso (IP, navegador, página aberta) e os próprios
            cookies, como descrito acima.
          </li>
          <li>
            <b>Empresas de hospedagem</b> que mantêm os servidores e o banco de dados do site, só para o site funcionar.
          </li>
          <li>
            <b>Autoridades</b>, quando houver ordem judicial ou obrigação legal.
          </li>
        </ul>
        <p>
          Alguns desses serviços ficam fora do Brasil (o Google e o Discord, por exemplo, nos Estados Unidos). Nesses casos a transferência é
          necessária para prestar o serviço que você pediu.
        </p>
      </Block>

      <Block title="Por quanto tempo">
        <ul>
          <li>Os dados da conta ficam enquanto ela existir.</li>
          <li>As sessões de login expiram em 60 dias ou quando você sai.</li>
          <li>Os registros técnicos de acesso são apagados periodicamente.</li>
          <li>
            Ao <b>excluir a conta</b>, apagamos na hora o perfil, as partidas, as conquistas, os amigos e as sessões. Cópias de segurança do banco,
            se existirem, somem quando forem substituídas.
          </li>
        </ul>
      </Block>

      <Block title="Seus direitos">
        <p>Pela LGPD (art. 18), você pode a qualquer momento:</p>
        <ul>
          <li>confirmar se tratamos seus dados e pedir uma cópia deles;</li>
          <li>corrigir dados errados ou desatualizados;</li>
          <li>pedir a exclusão, o bloqueio ou a anonimização de dados desnecessários;</li>
          <li>levar seus dados para outro serviço (portabilidade);</li>
          <li>saber com quem compartilhamos e se opor a um tratamento;</li>
          <li>reclamar na Autoridade Nacional de Proteção de Dados (ANPD).</li>
        </ul>
        <p>
          Muita coisa você faz sozinho em <b>Perfil &gt; Conta</b>: trocar o @usuário, deixar o perfil privado, desconectar o Google ou o Discord
          e <b>excluir a conta</b>. O resto, peça por <Email />. Respondemos em até 15 dias.
        </p>
      </Block>

      <Block title="Segurança">
        <p>
          O site usa conexão criptografada (HTTPS), não guarda senhas (o login é feito pelo Google ou pelo Discord) e o acesso ao banco de dados
          é restrito. Nenhum sistema é 100% seguro: se acontecer um incidente que possa trazer risco a você, avisaremos você e a ANPD.
        </p>
      </Block>

      <Block title="Crianças e adolescentes">
        <p>
          Os jogos podem ser jogados por qualquer pessoa, sem conta. Para criar uma conta é preciso ter pelo menos 13 anos, que também é a idade
          mínima do Google e do Discord. Se você tem menos de 18, use o site com o conhecimento dos seus pais ou responsáveis. Se souber de uma
          conta de criança com menos de 13 anos, escreva para <Email /> que nós a apagamos.
        </p>
      </Block>

      <Block title="Mudanças nesta política">
        <p>
          Quando esta política mudar, a data no topo da página muda junto. Se a mudança for importante, avisaremos no site antes de ela valer.
        </p>
      </Block>
    </LegalPage>
  );
}
