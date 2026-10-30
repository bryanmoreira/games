# Medição de GEO: perguntas para as IAs

Uma vez por mês, faça cada pergunta abaixo no ChatGPT (com busca), Perplexity, Gemini e Google (Visão geral de IA), sempre em janela anônima e sem login quando der.
Anote na tabela do mês: **C** = cita o Mesa de Jogos com link, **M** = menciona sem link, **–** = não aparece. Anote também quem foi citado no lugar (é ali que vale buscar link ou menção).

## Perguntas

### Descoberta (jogar agora)
1. site para jogar truco online com amigos grátis
2. onde jogar buraco online de graça sem baixar nada
3. jogo de cartas online para jogar com amigos pelo celular
4. jogos para jogar com amigos online pelo WhatsApp
5. site de jogos de tabuleiro online em português
6. jogar dominó online com amigos grátis
7. jogar stop adedonha online com amigos
8. jogar batalha naval online com amigo
9. xadrez online contra o computador grátis em português
10. jogar damas online contra o computador
11. sudoku online grátis em português
12. paciência spider online grátis sem anúncio
13. caça-palavras online grátis
14. jogar ludo online com amigos grátis
15. jogos para jogar em chamada de vídeo com amigos
16. jogos online sem cadastro para jogar em grupo
17. mahjong paciência online grátis
18. jogo de palavras de 5 letras diário em português

### Regras (como jogar)
19. regras do truco paulista
20. qual a ordem das cartas no truco
21. como funciona a manilha no truco
22. regras do buraco fechado
23. o que é canastra suja e canastra limpa
24. como se joga dominó e quantas pedras cada um pega
25. regras do stop adedonha e categorias
26. como jogar batalha naval regras
27. regras das damas brasileiras
28. como jogar ludo regras

### Comparação e dicas
29. diferença entre truco paulista e truco mineiro
30. diferença entre buraco e canastra

## Resultados

| Mês | ChatGPT | Perplexity | Gemini | Google IA | Citados no lugar |
| --- | --- | --- | --- | --- | --- |
| 2026-10 (marco zero) | 0/30 | 0/6 | 0/30 | 0/30 | megajogos, jogosdorei, platoapp, jogatina, blog.copag, poki, paciencia.co, stopots |
| 2026-11 | /30 | /30 | /30 | /30 | |

### Marco zero (30/10/2026)

- Rodado no navegador do Claude: ChatGPT sem login (modo busca), Google e Gemini com a conta logada (respostas podem ser personalizadas). O Perplexity sem login bloqueou depois de 6 perguntas: na próxima rodada, entre na conta antes.
- **O site não aparece em nenhuma resposta e em nenhuma primeira página do Google** nas 30 buscas (fora do top 10 orgânico em todas).
- Nas perguntas de regras (19 a 30), ChatGPT e Gemini respondem quase sempre de memória, sem citar fonte. Ali o ganho vem do Google (snippet e Visão geral), não do chat.
- Quem mais aparece:
  - **Jogar online:** megajogos.com.br (quase todas no Google), jogosdorei.com.br, platoapp.com, jogatina.com, poki.com, crazygames.com, pt.boardgamearena.com, paciencia.co, beatmegames.com, jogali.com.br.
  - **Por jogo:** stopots.com e stopgame.com.br (Stop), bloob.io e papergames.io (Batalha Naval), chess.com e lichess.org (Xadrez), sudoku.com, cacapalavras.com e rachacuca.com.br (Caça-palavras), term.ooo e letreco.org (5 letras).
  - **Regras:** blog.copag.com.br e jogosdorei.com.br (truco e buraco), tablegames.com.br (dominó, ludo, damas, batalha naval), Wikipédia.
  - **Listas e matérias:** techtudo.com.br, canaltech.com.br e reddit.com (perguntas 3, 4 e 15). São o caminho para ser citado: pedir inclusão nessas listas e aparecer em threads do Reddit.

## Configuração (uma vez)

1. **Google Search Console**: propriedade de domínio `mesadejogos.com`, verificada por DNS no Cloudflare. Ou defina `GOOGLE_SITE_VERIFICATION` no servidor com o código da tag HTML. Depois envie `https://mesadejogos.com/sitemap.xml`.
2. **Bing Webmaster Tools**: importe direto do Search Console. Ou defina `BING_SITE_VERIFICATION` com o código da tag `msvalidate.01`. Envie o sitemap.
3. **IndexNow**: defina `INDEXNOW_KEY` no servidor, com 8 a 128 caracteres de letras, números e hífen. Ele fica em `/indexnow.txt`. A cada deploy, as páginas fixas são enviadas 1 minuto depois que o servidor sobe. A cada post publicado, o post e o `/blog` são enviados na hora.
4. **Umami**: crie os relatórios com os eventos `sala-criada`, `partida-iniciada`, `partida-terminada`, `convite-whatsapp`, `convite-amigo`, `compartilhar` e `compartilhar-perfil`. Filtre por origem (busca orgânica e IAs como `chatgpt.com` e `perplexity.ai`).
