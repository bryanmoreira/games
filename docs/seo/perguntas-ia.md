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
| 2026-11 | /30 | /30 | /30 | /30 | |

## Configuração (uma vez)

1. **Google Search Console**: propriedade de domínio `mesadejogos.com`, verificada por DNS no Cloudflare. Ou defina `GOOGLE_SITE_VERIFICATION` no servidor com o código da tag HTML. Depois envie `https://mesadejogos.com/sitemap.xml`.
2. **Bing Webmaster Tools**: importe direto do Search Console. Ou defina `BING_SITE_VERIFICATION` com o código da tag `msvalidate.01`. Envie o sitemap.
3. **IndexNow**: defina `INDEXNOW_KEY` no servidor, com 8 a 128 caracteres de letras, números e hífen. Ele fica em `/indexnow.txt`. A cada deploy, as páginas fixas são enviadas 1 minuto depois que o servidor sobe. A cada post publicado, o post e o `/blog` são enviados na hora.
4. **Umami**: crie os relatórios com os eventos `sala-criada`, `partida-iniciada`, `partida-terminada`, `convite-whatsapp`, `convite-amigo`, `compartilhar` e `compartilhar-perfil`. Filtre por origem (busca orgânica e IAs como `chatgpt.com` e `perplexity.ai`).
