# Som

Referência: `apps/web/lib/sound.ts` (núcleo: `audio()`, mudo, `useAudioUnlock`, `playCardSound`), `lib/truco/sound.ts` e `lib/spider/sound.ts` (sons de cada jogo) e `useSounds` em `components/truco/Table.tsx`.

## Princípios

- **Sintetizado com Web Audio**: nada de arquivos de áudio (sem licença para checar, sem download extra).
- **Sem voz.** O usuário testou `speechSynthesis` falando "Truco!" e pediu para remover. Não reintroduza.
- **Mudo** (`MuteButton` em `components/ui/buttons.tsx`, ícone SVG no topo) salvo em `localStorage("truco.muted")`. Com mudo ligado, `audio()` retorna `null` e nada toca.
- Navegadores só liberam áudio depois de um gesto do usuário: `unlockAudio()` num listener de `pointerdown` na janela cria/retoma o `AudioContext`.

## Sons existentes

- `playCardSound()`: "tap" de carta na mesa — ruído branco curto (90 ms, decaimento cúbico) num `bandpass` ~2.2–2.8 kHz, com variação aleatória de pitch/frequência a cada jogada, mais um "thud" senoidal 160→60 Hz.
- `playTrucoSound(value)`: acorde de serra (fundamental + terça + quinta + oitava) com leve subida de pitch, passando por um `lowpass` que fecha, e envelope curto (~0.7 s). Fica mais agudo a cada aumento (2 semitons por degrau: truco < seis < nove < doze).

## Quando tocar

Dispare a partir de **mudanças de estado da view**, não dos cliques. Assim os sons tocam para as jogadas de todos (humanos e IAs) e não tocam ao entrar ou recarregar no meio da mão:

```ts
const plays = view.rounds.reduce((n, r) => n + r.plays.length, 0);
const prev = useRef({ hand: view.handNo, plays, shout: view.shout?.id }); // inicial = estado atual, sem som
useEffect(() => {
  const p = prev.current;
  if (view.handNo === p.hand && plays > p.plays) playCardSound();
  if (view.shout && view.shout.id !== p.shout && view.shout.kind === "truco") playTrucoSound(view.shout.value);
  prev.current = { hand: view.handNo, plays, shout: view.shout?.id };
}, [view.handNo, plays, view.shout]);
```

Para um jogo novo, crie funções no mesmo estilo para os eventos marcantes dele (ex.: bater, comprar carta, vitória). Mantenha os sons curtos e discretos; peça confirmação ao usuário antes de adicionar sons além de "carta jogada" e do evento principal do jogo.

## Como verificar sem ouvir

Instrumente o navegador e conte as chamadas, deixando a partida rodar automatizada:

```js
const P = AudioContext.prototype, n = { buf: 0, osc: 0 };
const cb = P.createBufferSource; P.createBufferSource = function (...a) { n.buf++; return cb.apply(this, a); };
const co = P.createOscillator;  P.createOscillator  = function (...a) { n.osc++; return co.apply(this, a); };
```

Cada carta = 1 buffer + 1 oscilador; cada truco = 4 osciladores. Com mudo ligado, os contadores não podem mudar.
