"use client";

import { KINDS, type Key } from "@mesa/tijolada";
import { Section } from "@/components/ui/HowToSection";
import { Icon } from "@/components/ui/buttons";
import { TijoladaArt } from "./Art";
import { MiniPiece } from "./Board";
import { KEY_ICON, KEY_LABEL } from "./controls";

function Cap({ children }: { children: React.ReactNode }) {
  return (
    <span className="flex h-8 min-w-8 items-center justify-center rounded-lg border-2 border-white/30 bg-white/10 px-2 font-display text-xs shadow-[0_3px_0_rgba(255,255,255,0.15)]">
      {children}
    </span>
  );
}

// seta de cada tecla, em SVG
const ARROW: Partial<Record<Key, string>> = { left: "m15 18-6-6 6-6", right: "m9 18 6-6-6-6", down: "m6 9 6 6 6-6", cw: "m6 15 6-6 6 6" };

// teclas de cada comando (a seta vira ícone na tecla)
const KEYS: { key: Key; caps: React.ReactNode[] }[] = [
  { key: "left", caps: ["arrow", "A"] },
  { key: "right", caps: ["arrow", "D"] },
  { key: "down", caps: ["arrow", "S"] },
  { key: "cw", caps: ["arrow", "X"] },
  { key: "ccw", caps: ["Z"] },
  { key: "drop", caps: ["ESPAÇO"] },
  { key: "hold", caps: ["C", "SHIFT"] },
];

const POINTS: [string, string][] = [
  ["1 linha", "100"],
  ["2 linhas", "300"],
  ["3 linhas", "500"],
  ["4 linhas", "800"],
];

/** Regras ilustradas da Tijolada (página "Como jogar" e janela dentro da partida). */
export function HowToPlay() {
  return (
    <>
      <Section n={1} title="Objetivo">
        <TijoladaArt className="mx-auto w-40" />
        <p className="text-center text-sm text-white/70">
          Os tijolos caem um por vez. Encaixe para <b className="text-white">completar linhas</b>: linha completa some e dá pontos. A partida
          acaba quando a peça nova não cabe mais no topo.
        </p>
      </Section>

      <Section n={2} title="As peças">
        <div className="mx-auto grid max-w-sm grid-cols-4 gap-3 sm:grid-cols-7">
          {KINDS.map((k) => (
            <MiniPiece key={k} kind={k} className="aspect-[2/1] w-full" />
          ))}
        </div>
        <p className="text-center text-sm text-white/70">
          Elas saem em <b className="text-white">sacos de 7</b>: cada uma aparece uma vez a cada 7. As 3 próximas ficam à vista, e a{" "}
          <b className="text-white">sombra</b> mostra onde a peça vai parar.
        </p>
      </Section>

      <Section n={3} title="Controles">
        <div className="mx-auto grid w-full max-w-md grid-cols-[auto_1fr_auto] items-center gap-x-3 gap-y-2">
          {KEYS.map(({ key, caps }) => (
            <div key={key} className="contents">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15">
                <Icon className="h-5 w-5">{KEY_ICON[key]}</Icon>
              </span>
              <span className="font-display text-sm">{KEY_LABEL[key]}</span>
              <span className="flex justify-end gap-1">
                {caps.map((c, i) => (
                  <Cap key={i}>
                    {c === "arrow" ? (
                      <Icon className="h-4 w-4">
                        <path d={ARROW[key]} />
                      </Icon>
                    ) : (
                      c
                    )}
                  </Cap>
                ))}
              </span>
            </div>
          ))}
        </div>
        <p className="text-center text-sm text-white/70">
          Segurando para o lado ou para baixo, a peça continua andando. No celular, os mesmos botões ficam embaixo do campo. P pausa o solo.
        </p>
      </Section>

      <Section n={4} title="Guardar">
        <p className="text-center text-sm text-white/70">
          Guarda a peça da vez para depois (ou troca com a guardada). Vale <b className="text-white">uma vez por peça</b>.
        </p>
      </Section>

      <Section n={5} title="Pontos">
        <div className="mx-auto grid w-full max-w-xs grid-cols-2 gap-x-6 gap-y-1 font-display text-sm">
          {POINTS.map(([l, p]) => (
            <div key={l} className="contents">
              <span className="text-white/70">{l}</span>
              <span className="text-right text-gold">{p} × nível</span>
            </div>
          ))}
        </div>
        <ul className="mx-auto max-w-md list-disc space-y-1 pl-5 text-sm text-white/70">
          <li>
            4 linhas logo depois de outras 4 valem <b className="text-white">1,5×</b>.
          </li>
          <li>
            Limpar linhas em peças seguidas é <b className="text-white">combo</b>: +50 × combo × nível.
          </li>
          <li>Descer dá 1 ponto por linha; cair de vez, 2.</li>
        </ul>
      </Section>

      <Section n={6} title="Solo e 1×1">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl bg-black/25 p-3 text-sm text-white/70">
            <b className="block font-display text-gold">SOLO</b>O nível sobe a cada <b className="text-white">10 linhas</b> e as peças caem mais
            rápido. Bata o seu recorde.
          </div>
          <div className="rounded-xl bg-black/25 p-3 text-sm text-white/70">
            <b className="block font-display text-gold">1×1</b>Os dois recebem <b className="text-white">as mesmas peças</b>, cada um no seu campo.
            O nível sobe a cada <b className="text-white">30 segundos</b>. Perde quem acabar primeiro.
          </div>
        </div>
      </Section>
    </>
  );
}
