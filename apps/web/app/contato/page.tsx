import type { Metadata } from "next";
import Link from "next/link";
import { Block, Email, LegalPage } from "@/components/legal/LegalPage";
import { ABOUT_PATH, CONTACT_PATH, PRIVACY_PATH } from "@/lib/legal";
import { SITE_NAME } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Contato",
  description: `Fale com o ${SITE_NAME}: erros, sugestões de jogos, dúvidas sobre regras, conta e privacidade.`,
  alternates: { canonical: CONTACT_PATH },
};

const link = "text-gold underline-offset-4 hover:underline";

export default function ContactPage() {
  return (
    <LegalPage title="CONTATO" dated={false}>
      <Block title="Escreva para nós">
        <p>
          O jeito mais rápido de falar com o {SITE_NAME} é por e-mail: <Email />. Todas as mensagens são lidas pela pessoa que faz o site (veja
          quem em{" "}
          <Link href={ABOUT_PATH} className={link}>
            Sobre
          </Link>
          ).
        </p>
      </Block>

      <Block title="Sobre o que escrever">
        <ul>
          <li>
            <b>Erro ou travamento</b>: diga o jogo, o que aconteceu e, se puder, o aparelho e o navegador. Um print ajuda muito.
          </li>
          <li>
            <b>Regra diferente</b>: muitos jogos têm variações regionais. Se a sua mesa joga de outro jeito, conte qual regra e de onde ela vem.
          </li>
          <li>
            <b>Ideia de jogo ou recurso</b>: os próximos jogos e melhorias saem em boa parte das sugestões dos jogadores.
          </li>
          <li>
            <b>Conta e dados pessoais</b>: pedidos de acesso, correção ou exclusão dos seus dados seguem a{" "}
            <Link href={PRIVACY_PATH} className={link}>
              Política de Privacidade
            </Link>
            .
          </li>
          <li>
            <b>Comportamento de outro jogador</b>: informe o jogo, o horário e o nome usado na sala.
          </li>
        </ul>
      </Block>
    </LegalPage>
  );
}
