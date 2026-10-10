# "Como jogar" e dicas das cartas

## "Como jogar"

Referências: `components/truco/HowToPlay.tsx` (conteúdo), `components/ui/HowToPlayModal.tsx` (casca do modal, recebe o conteúdo como filho), `components/ui/buttons.tsx` (`HelpButton`), `app/truco-paulista/como-jogar/page.tsx` (página).

- O **conteúdo fica num componente só** (`HowToPlay`), usado pela página `/<slug>/como-jogar` e pelo modal aberto no botão "?" dentro da partida. Mudou uma regra, as duas atualizam.
- Na partida, use o **modal**, nunca navegação: sair da página no meio do jogo faz uma IA assumir o seu lugar. O modal fecha com X, Esc ou clique fora (clique dentro não fecha) e tem rolagem própria (`max-h-full overflow-y-auto`).
- A página tem `BackButton` para `/<slug>`, título "COMO JOGAR" + nome do jogo, fundo sólido `bg-[#0f1813]` e botão "Bora jogar" no fim. Na página inicial do jogo, um link "Como jogar" com ícone de interrogação fica abaixo do campo de código.

Estrutura das seções (cartões numerados, título em `font-display`, pouco texto e **imagens reais das cartas** via `CardImg`):
1. Objetivo (quem contra quem, quantos pontos para vencer) com avatares coloridos por time.
2. Força das cartas: as cartas em ordem numa grade, com uma barra "mais fraca → mais forte".
3. Mecânicas especiais com algo **interativo** quando ajudar (no truco: `ViraPicker`, onde o jogador toca numa vira e vê as 4 manilhas com nome).
4. Uma rodada de exemplo com a carta vencedora destacada + casos de empate usando as mesmas mini-marcas ✓ ✕ = do placar da mesa.
5. Apostas/pontuação com os mesmos botões da mesa (QUERO/CORRO/aumentar) e o que cada um faz.
6. Jogadas especiais (carta coberta, mostrando o ícone de virar → verso).
7. Situações especiais (mão de 11, mão de ferro) em cards lado a lado.

Reaproveite os componentes visuais da mesa (mini-marcas, botões, cartas) para que a explicação e o jogo tenham a mesma cara. No celular, verifique que nada quebra em duas linhas de forma estranha (a escada do truco precisou encolher em `<sm`).

## Dicas das cartas (hover)

Referência: `components/truco/CardInfo.tsx`.

- Ao passar o mouse numa carta da sua mão, um painel aparece **no canto direito, abaixo dos botões do topo** (`absolute top-full` dentro do `header`), com a carta, o nome dela por extenso e:
  - carta comum: **VENCE** (chips das cartas mais fracas), **EMPATA** (mesma carta de outro naipe), **PERDE** (mais fortes + mini cartas das manilhas). Tudo calculado com a manilha/trunfo **da mão atual**;
  - carta especial (manilha): selo dourado "★ MANILHA · NOME", "vence todas as cartas comuns" + manilhas mais fracas, perde para as mais fortes, ou "nenhuma — a mais forte do jogo" (Zap), e a ordem das manilhas.
- Botão de lâmpada no topo (`TipsButton`, `aria-pressed`) liga/desliga as dicas; vem ligado e fica salvo em `localStorage("truco.tips")`.
- Painel e botão ficam ocultos em telas touch (`[@media(hover:none)]:hidden`), porque não existe hover.
- O painel some ao tirar o mouse e também quando a carta sai da mão. O `mouseleave` não dispara quando o elemento desmonta, então derive a carta exibida filtrando pela mão atual em vez de confiar só no evento.

Para outro jogo, adapte o conteúdo do painel ao que importa na decisão do jogador (ex.: se a carta é trunfo, quantos pontos vale, quais cartas ainda podem vencê-la), mantendo o mesmo formato visual de linhas com rótulo colorido e chips.
