import { FLEET, type Ship } from "@truco/batalha-naval";
import { Section } from "@/components/ui/HowToSection";
import { Fire, Sea, SeaShip, ShipShape, Splash } from "./Sea";
import { DiceIcon, MoveIcon, RotateIcon } from "./Placement";

// frota de exemplo com navios encostados (vale) e em pé/deitados
const EXAMPLE: Ship[] = [
  { col: 1, row: 1, dir: "h" },
  { col: 8, row: 3, dir: "v" },
  { col: 1, row: 2, dir: "h" },
  { col: 3, row: 6, dir: "v" },
  { col: 6, row: 8, dir: "h" },
];

/** Regras ilustradas da Batalha Naval (página "Como jogar" e janela dentro da partida). */
export function HowToPlay() {
  return (
    <>
      <Section n={1} title="Objetivo">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center sm:gap-8">
          <div className="flex items-center gap-4 font-display">
            <Player tone="gold" name="Você" />
            <span className="text-white/40">×</span>
            <Player tone="red" name="Adversário" />
          </div>
          <div className="flex items-center gap-3 rounded-2xl bg-black/40 px-4 py-2 font-display">
            <span className="text-3xl text-gold">5</span>
            <span className="text-sm leading-tight text-white/70">
              navios
              <br />
              afundados
            </span>
          </div>
        </div>
        <p className="text-center text-sm text-white/70">Um contra um. Vence quem afundar a frota inteira do outro primeiro.</p>
      </Section>

      <Section n={2} title="A frota">
        <div className="mx-auto flex flex-col gap-2.5">
          {FLEET.map((k, i) => (
            <div key={k.id} className="flex items-center gap-3">
              <div className="h-6 shrink-0 sm:h-7" style={{ width: `${k.size * 1.5}rem` }}>
                <ShipShape index={i} />
              </div>
              <span className="font-display text-sm text-gold">{k.size}</span>
              <span className="text-sm text-white/70">{k.name}</span>
            </div>
          ))}
        </div>
        <p className="text-center text-sm text-white/70">Mar de 10 × 10 casas para cada um.</p>
      </Section>

      <Section n={3} title="Posicione">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center sm:gap-8">
          <Sea className="w-48 sm:w-56">
            {EXAMPLE.map((ship, i) => (
              <SeaShip key={i} ship={ship} index={i} />
            ))}
          </Sea>
          <div className="flex flex-col gap-2 text-sm text-white/70">
            <Step icon={<MoveIcon className="h-5 w-5" />} text="arraste para mover" />
            <Step icon={<RotateIcon className="h-5 w-5" />} text="toque (ou R) para girar no meio" />
            <Step icon={<DiceIcon className="h-5 w-5" />} text="sorteia tudo" />
            <Step
              icon={<span className="rounded-md bg-gold px-1.5 py-0.5 font-display text-[10px] text-stone-900">PRONTO</span>}
              text="confirma"
            />
          </div>
        </div>
        <p className="text-center text-sm text-white/70">
          Deitados ou em pé. Os navios <b className="text-white">podem encostar</b>, só não podem ficar um em cima do outro. Os dois
          montam ao mesmo tempo, sem ver a frota do outro.
        </p>
      </Section>

      <Section n={4} title="Atire">
        <div className="grid grid-cols-3 gap-3">
          <Outcome label="ÁGUA" sub="passa a vez">
            <Splash />
          </Outcome>
          <Outcome label="FOGO" sub="atira de novo" gold>
            <Fire />
          </Outcome>
          <Outcome label="AFUNDOU" sub="aparece inteiro" gold wide>
            <span className="absolute inset-y-0 left-0 w-[200%] p-[3%]">
              <ShipShape index={4} tone="sunk" />
            </span>
            <Fire out />
            <span className="absolute inset-y-0 left-full w-full">
              <Fire out />
            </span>
          </Outcome>
        </div>
        <p className="text-center text-sm text-white/70">
          Um tiro por vez no mar do adversário. <b className="text-white">Acertou, atira de novo</b>; errou, a vez passa. Quando todas as
          casas de um navio são atingidas, ele afunda.
        </p>
      </Section>

      <Section n={5} title="De novo">
        <div className="flex flex-wrap items-center justify-center gap-3">
          <div className="flex items-center gap-3 rounded-2xl bg-black/40 px-4 py-2 font-display">
            <div className="flex flex-col items-center gap-0.5 leading-none">
              <span className="h-3 w-6">
                <ShipShape index={4} tone="gold" />
              </span>
              <span className="text-3xl text-gold">2</span>
            </div>
            <span className="text-white/30">×</span>
            <div className="flex flex-col items-center gap-0.5 leading-none">
              <span className="h-3 w-6">
                <ShipShape index={4} tone="red" />
              </span>
              <span className="text-3xl">1</span>
            </div>
          </div>
          <span className="rounded-xl bg-gold px-5 py-2 font-display text-stone-900 shadow-[0_4px_0_#9a6b12]">De novo</span>
        </div>
        <p className="text-center text-sm text-white/70">
          Na mesma sala o placar vai somando, e quem dá o primeiro tiro <b className="text-white">alterna</b> a cada partida.
        </p>
      </Section>
    </>
  );
}

function Player({ tone, name }: { tone: "gold" | "red"; name: string }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <span className="h-6 w-16">
        <ShipShape index={2} tone={tone} />
      </span>
      <span className={`text-xs ${tone === "gold" ? "text-gold" : "text-red-400"}`}>{name}</span>
    </div>
  );
}

function Step({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-8 w-14 items-center justify-center text-white">{icon}</span>
      {text}
    </div>
  );
}

function Outcome({ label, sub, gold, wide, children }: { label: string; sub: string; gold?: boolean; wide?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <Sea
        className={`!aspect-auto h-12 sm:h-14 ${wide ? "w-24 sm:w-28" : "w-12 sm:w-14"}`}
        style={{ backgroundSize: `${wide ? "50%" : "100%"} 100%, 100% 100%, 100% 100%` }}
      >
        <span className="absolute inset-y-0 left-0 aspect-square">{children}</span>
      </Sea>
      <span className={`font-display text-xs ${gold ? "text-gold" : "text-white"}`}>{label}</span>
      <span className="text-center text-[11px] text-white/60">{sub}</span>
    </div>
  );
}
