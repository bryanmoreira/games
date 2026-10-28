# Exemplo comentado de post

Um post completo no padrão da skill, como seria enviado no `post.json`. Os comentários (linhas com `←`) explicam as escolhas e **não** entram no post. As regras citadas são as do Buraco do Mesa de Jogos; num post real, confira sempre no código.

## Campos

```json
{
  "title": "Canastra no Buraco: quanto vale e como fazer",
  "slug": "canastra-no-buraco",
  "description": "Veja o que é canastra no buraco, quanto vale a limpa, a suja e a real e como montar a sua mais rápido. Com exemplos e onde jogar grátis.",
  "game": "buraco",
  "keyword": "canastra no buraco",
  "date": "",
  "draft": true,
  "cover": "/blog/imagens/<id>-1200x630.png",
  "coverAlt": "Mesa de buraco no Mesa de Jogos com uma canastra limpa de copas, do 3 ao 9, baixada na frente da dupla",
  "body": "…o Markdown abaixo…"
}
```

← título com 44 caracteres e a palavra-chave no começo; descrição com 140–160 caracteres; `date` vazio = hoje; sempre rascunho.

## Corpo

```markdown
No buraco, a canastra é um jogo de 7 ou mais cartas. A canastra limpa, sem curinga, vale 200 pontos; a suja, com curinga, vale 100; e a real, do ás ao rei sem curinga, vale 500. Sem pelo menos uma canastra, ninguém pode bater.

> **Resumo:** canastra = 7 ou mais cartas em sequência do mesmo naipe. Limpa vale 200, suja vale 100 e real vale 500. Bater exige uma canastra.

## O que é canastra no buraco?

Canastra é uma sequência de 7 ou mais cartas do mesmo naipe baixada na mesa. No buraco, os jogos são sequências de pelo menos 3 cartas, e um jogo vira canastra quando chega a 7.

## Quanto vale cada canastra?

- **Limpa:** 200 pontos. Sete ou mais cartas sem nenhum curinga.
- **Suja:** 100 pontos. Tem um curinga no lugar de alguma carta.
- **Real:** 500 pontos. Limpa e completa, do ás ao rei do mesmo naipe.

![Três canastras de copas: limpa de 3 a 9, suja com um coringa no lugar do 6 e real do ás ao rei](/blog/imagens/<id>-1200x630.png "Canastra limpa, suja e real, com os pontos de cada uma")

## Como fazer canastra mais rápido

1. **Comece jogos cedo:** sequências de 3 cartas na mesa crescem com as cartas que você compra.
2. **Pegue o lixo quando ele completa um jogo seu:** muitas cartas de uma vez aceleram a canastra.
3. **Guarde o curinga para fechar:** usar o curinga cedo transforma uma possível limpa (200) em suja (100).
4. **Combine com o parceiro:** em dupla, os jogos na mesa são da dupla, então os dois aumentam a mesma sequência.

## Qual versão o Mesa de Jogos usa?

No Mesa de Jogos você joga **buraco fechado**, em duplas ou no 1×1, grátis e sem cadastro:

- **Jogos:** só sequências de 3 ou mais cartas do mesmo naipe.
- **Curingas:** o coringa e o 2, no máximo um por jogo.
- **Batida:** depois de pegar o morto e com pelo menos uma canastra. Vale 100.
- **Partida:** vence quem chegar a 3000 pontos.

As regras completas, com exemplos, estão em [Como jogar Buraco](/buraco/como-jogar). Para melhorar o jogo, veja também as [10 dicas para ganhar mais no Buraco](/blog/dicas-para-ganhar-no-buraco).

## Perguntas frequentes

### Pode bater sem canastra no buraco?
Não. Para bater é preciso ter pelo menos uma canastra na mesa, além de ter pegado o morto.

### Quantos curingas cabem numa canastra?
No Mesa de Jogos, no máximo um curinga por jogo. Uma canastra com curinga é suja e vale 100 pontos.

### Canastra e buraco são o mesmo jogo?
São da mesma família e muita gente usa os dois nomes. Veja as diferenças em [Buraco ou Canastra: qual é a diferença?](/blog/buraco-ou-canastra-diferenca).

## Jogue agora

Crie a sala, chame os amigos pelo WhatsApp e treine suas canastras. Lugar vazio fica com o computador: [Jogar Buraco grátis](/buraco).
```

## Por que está assim

- **Primeiro parágrafo** responde em ~50 palavras, com números e a palavra-chave: é o candidato a trecho em destaque e a citação de IA.
- **Resumo em citação** dá os fatos-chave numa frase cada (GEO).
- **H2 em forma de pergunta** casam com "As pessoas também perguntam"; a primeira frase de cada seção é a resposta.
- **Lista numerada** para o "como fazer" (Google mostra como passo a passo).
- **Seção do site** conecta o tema ao jogo daqui, com as regras reais.
- **4 links internos** (como jogar, dois posts relacionados, página do jogo) com texto descritivo.
- **Perguntas frequentes** só com o que o corpo ainda não respondeu num H2.
- **Nenhum `#`**, nenhuma tabela, nenhum travessão: só o Markdown aceito.
