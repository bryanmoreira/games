import { describe, expect, test } from "bun:test";
import { Ev, HL, HW, POCKETS, R, run, rack, setState, simulate, St, strike, toBalls, type Ball, type Shot, type BallPos, type SimResult } from "../src";

const deg = (rad: number) => (rad * 180) / Math.PI;

/** Bolas paradas com a branca já andando (sem passar pela tacada). */
function moving(pos: BallPos[], cue: Partial<Ball>): Ball[] {
  const balls = toBalls(pos);
  Object.assign(balls[0], cue);
  setState(balls[0]);
  return balls;
}

const final = (r: SimResult, n: number) => r.balls.find((b) => b.n === n)!;

/** Bolas com a tacada já dada na branca. */
function toBallsShot(pos: BallPos[], shot: Shot): Ball[] {
  const balls = toBalls(pos);
  strike(balls[0], shot);
  return balls;
}

/** Cópia das bolas quando acontece o choque número `k` (a partir de 1). */
function atEvent(balls: Ball[], k: number, kind?: Ev): Ball[] {
  let snap: Ball[] = [];
  run(balls, {
    stop: (bs, ev) => {
      if (ev.filter((e) => kind === undefined || e.kind === kind).length >= k) {
        snap = bs.map((b) => ({ ...b }));
        return true;
      }
      return false;
    },
  });
  return snap;
}

/** Velocidades logo depois do primeiro choque entre bolas. */
function afterFirstHit(balls: Ball[]) {
  let snap: { a: Ball; b: Ball } | null = null;
  run(balls, {
    stop: (bs, ev) => {
      if (ev.some((e) => e.kind === Ev.Ball)) {
        snap = { a: { ...bs[0] }, b: { ...bs[1] } };
        return true;
      }
      return false;
    },
  });
  return snap!;
}

describe("bola com bola", () => {
  test("tacada seca em bola cheia: a branca para no lugar", () => {
    // quando a bola atingida chega na tabela do fundo, a branca já parou perto de onde bateu
    const [cue, ball] = atEvent(moving([{ n: 0, x: -0.2, y: 0 }, { n: 1, x: -0.2 + 2 * R + 0.001, y: 0 }], { vx: 2 }), 1, Ev.Cushion);
    expect(Math.abs(cue.x - -0.2)).toBeLessThan(0.03);
    expect(cue.s).toBe(St.Still);
    expect(ball.x).toBeGreaterThan(1);
  });

  test("efeito alto: a branca segue a bola", () => {
    const [cue] = atEvent(moving([{ n: 0, x: -0.5, y: 0 }, { n: 1, x: -0.5 + 2 * R + 0.001, y: 0 }], { vx: 2, wy: 2 / R }), 1, Ev.Cushion);
    expect(cue.x).toBeGreaterThan(-0.1);
  });

  test("efeito baixo: a branca volta", () => {
    const [cue] = atEvent(moving([{ n: 0, x: 0, y: 0 }, { n: 1, x: 2 * R + 0.001, y: 0 }], { vx: 1.5, wy: -2 / R }), 1, Ev.Cushion);
    expect(cue.x).toBeLessThan(-0.15);
  });

  test("regra dos 90°: sem rotação, a branca sai perpendicular à bola atingida", () => {
    // meia bola: 30° de corte
    const off = R; // deslocamento lateral = R → sen(corte) = 1/2
    const hit = afterFirstHit(moving([{ n: 0, x: -Math.sqrt(3) * R - 0.001, y: 0 }, { n: 1, x: 0, y: off }], { vx: 2 }));
    const a = Math.atan2(hit.a.vy, hit.a.vx);
    const b = Math.atan2(hit.b.vy, hit.b.vx);
    const between = Math.abs(deg(b - a));
    // restituição < 1 e o atrito deixam um pouco abaixo de 90°, como na mesa de verdade
    expect(between).toBeGreaterThan(82);
    expect(between).toBeLessThan(90.5);
    // a bola atingida sai um pouco abaixo dos 30°: o atrito com a branca a arrasta junto (desvio do corte)
    expect(deg(b)).toBeGreaterThan(25.5);
    expect(deg(b)).toBeLessThan(29.5);
  });

  test("regra dos 30°: rolando em meia bola, a branca desvia uns 30°", () => {
    const pos = [{ n: 0, x: -0.6, y: 0 }, { n: 1, x: 0, y: R }];
    let contact = { x: 0, y: 0 };
    const balls = moving(pos, { vx: 1.2, wy: 1.2 / R });
    // acha onde foi o contato e onde a branca estava logo depois de pegar o rolamento de novo
    run(balls, {
      stop: (bs, ev) => {
        if (ev.length === 1 && contact.x === 0) contact = { x: bs[0].x, y: bs[0].y };
        return false;
      },
    });
    const r = run(moving(pos, { vx: 1.2, wy: 1.2 / R }), { record: 0.01 });
    const t = r.events[0].t + 0.6;
    const f = r.frames!.find((fr) => fr.t >= t)!;
    const angle = deg(Math.atan2(contact.y - f.data[1], f.data[0] - contact.x));
    expect(angle).toBeGreaterThan(25);
    expect(angle).toBeLessThan(37);
  });

  test("energia nunca aumenta", () => {
    const pos = [
      { n: 0, x: -0.8, y: 0.05 },
      { n: 1, x: 0, y: 0 },
      { n: 2, x: 0.3, y: 0.1 },
      { n: 3, x: 0.5, y: -0.2 },
    ];
    const energy = (bs: Ball[]) =>
      bs.reduce((e, b) => e + 0.5 * (b.vx ** 2 + b.vy ** 2) + 0.2 * R * R * (b.wx ** 2 + b.wy ** 2 + b.wz ** 2), 0);
    const balls = toBalls(pos);
    let last = Infinity;
    let count = 0;
    simulate(pos, { dx: 1, dy: 0, power: 0.8, spinX: 0.6, spinY: 0.5 }, {
      stop: (bs) => {
        const e = energy(bs);
        expect(e).toBeLessThanOrEqual(last * (1 + 1e-9));
        last = e;
        count++;
        return false;
      },
    });
    expect(count).toBeGreaterThan(3);
    void balls;
  });
});

describe("tabela", () => {
  test("bola rolando reta na tabela volta reta, mais devagar", () => {
    const balls = moving([{ n: 0, x: 0.5, y: 0 }], { vx: 1, wy: 1 / R });
    let after: Ball | null = null;
    run(balls, {
      stop: (bs, ev) => {
        if (ev.length) {
          after = { ...bs[0] };
          return true;
        }
        return false;
      },
    });
    const b = after! as Ball;
    expect(b.vx).toBeLessThan(-0.55);
    expect(b.vx).toBeGreaterThan(-0.9);
    expect(Math.abs(b.vy)).toBeLessThan(1e-9);
  });

  test("efeito lateral abre ou fecha o ângulo de saída", () => {
    const exit = (wz: number) => {
      const balls = moving([{ n: 0, x: 0, y: 0 }], { vx: 1, vy: 1, wx: -1 / R, wy: 1 / R, wz });
      let out = 0;
      run(balls, {
        stop: (bs, ev) => {
          if (ev.length) {
            out = deg(Math.atan2(Math.abs(bs[0].vy), Math.abs(bs[0].vx)));
            return true;
          }
          return false;
        },
      });
      return out;
    };
    const none = exit(0);
    const running = exit(-60);
    const reverse = exit(60);
    expect(none).toBeGreaterThan(30);
    expect(none).toBeLessThan(60);
    expect(Math.abs(running - reverse)).toBeGreaterThan(10);
    expect((running - none) * (reverse - none)).toBeLessThan(0);
  });
});

describe("caçapas", () => {
  test("bola reta no canto cai", () => {
    const p = POCKETS[0];
    const balls = moving([{ n: 0, x: p.mx - p.ox * 0.5, y: p.my - p.oy * 0.5 }], { vx: p.ox, vy: p.oy });
    const r = run(balls);
    expect(r.pocketed).toEqual([{ n: 0, pocket: 0 }]);
  });

  test("bola reta no meio cai", () => {
    const r = run(moving([{ n: 0, x: 0, y: 0 }], { vx: 0, vy: 1.5 }));
    expect(r.pocketed).toEqual([{ n: 0, pocket: 4 }]);
  });

  test("bola que bate na quina do meio não cai", () => {
    const r = run(moving([{ n: 0, x: 0.08, y: 0 }], { vx: 0, vy: 1.5 }));
    expect(r.pocketed).toEqual([]);
    expect(r.events.some((e) => e.kind === Ev.Cushion)).toBe(true);
  });

  test("bola rente à tabela entra no canto", () => {
    const r = run(moving([{ n: 0, x: 0.2, y: HW - R - 0.002 }], { vx: 1.5 }));
    expect(r.pocketed.map((p) => p.pocket)).toEqual([0]);
  });
});

describe("tacada", () => {
  const two = [{ n: 0, x: -0.5, y: 0 }, { n: 1, x: -0.15, y: 0 }];
  /** A branca quando a bola atingida chega na tabela do fundo (o contato é em x ≈ −0,207). */
  const shotAt = (spinY: number) =>
    atEvent(toBallsShot(two, { dx: 1, dy: 0, power: 0.5, spinX: 0, spinY }), 2)[0];

  test("taco embaixo puxa a branca de volta", () => {
    const cue = shotAt(-1);
    expect(cue.vx).toBeLessThan(-0.2);
    expect(cue.x).toBeLessThan(-0.22);
  });

  test("taco em cima faz a branca seguir", () => {
    const cue = shotAt(1);
    expect(cue.vx).toBeGreaterThan(0.4);
    expect(cue.x).toBeGreaterThan(-0.15);
  });

  test("taco no meio: a branca quase para", () => {
    expect(Math.abs(shotAt(0).vx)).toBeLessThan(0.25);
  });

  test("efeito lateral desvia a branca um pouco para o outro lado (efeito à direita, branca para a esquerda)", () => {
    const right = simulate([{ n: 0, x: -0.8, y: 0 }], { dx: 1, dy: 0, power: 0.15, spinX: 1, spinY: 0 });
    const { x, y } = right.balls[0];
    // uns 2° com o taco no limite do efeito
    const angle = deg(Math.atan2(y, x + 0.8));
    expect(angle).toBeGreaterThan(1);
    expect(angle).toBeLessThan(3.5);
  });

  test("tudo para dentro da mesa e sem bolas sobrepostas", () => {
    const pos: BallPos[] = [{ n: 0, x: -0.6, y: 0 }];
    let n = 1;
    for (let row = 0; row < 5; row++)
      for (let k = 0; k <= row; k++)
        pos.push({ n: n++, x: HL / 2 + row * Math.sqrt(3) * R * 1.0001, y: (k - row / 2) * 2 * R * 1.0001 });
    const t0 = performance.now();
    const r = simulate(pos, { dx: 1, dy: 0.002, power: 1, spinX: 0, spinY: 0 });
    const ms = performance.now() - t0;
    expect(r.time).toBeLessThan(40);
    for (const b of r.balls) {
      expect(Math.abs(b.x)).toBeLessThanOrEqual(HL - R + 1e-6);
      expect(Math.abs(b.y)).toBeLessThanOrEqual(HW - R + 1e-6);
    }
    for (let i = 0; i < r.balls.length; i++)
      for (let j = i + 1; j < r.balls.length; j++) {
        const a = r.balls[i];
        const b = r.balls[j];
        expect(Math.hypot(a.x - b.x, a.y - b.y)).toBeGreaterThan(2 * R - 1e-5);
      }
    console.log(`quebra: ${r.time.toFixed(1)} s simulados em ${ms.toFixed(0)} ms, ${r.pocketed.length} caíram`);
  });

  test("a mesma tacada dá sempre o mesmo resultado", () => {
    const pos = [{ n: 0, x: -0.5, y: 0.1 }, { n: 1, x: 0.2, y: 0 }, { n: 8, x: 0.4, y: 0.2 }];
    const shot = { dx: 0.9, dy: -0.1, power: 0.7, spinX: -0.3, spinY: 0.4 };
    expect(simulate(pos, shot)).toEqual(simulate(pos, shot));
  });

  test("gravar a animação não muda nada (o navegador refaz a tacada do servidor)", () => {
    const pos: BallPos[] = [{ n: 0, x: -0.7, y: 0.05 }, ...rack(() => 0.37)];
    const shot = { dx: 0.998, dy: -0.06, power: 1, spinX: 0.1, spinY: -0.2 };
    const plain = simulate(pos, shot);
    const recorded = simulate(pos, shot, { record: 1 / 120 });
    expect(recorded.balls).toEqual(plain.balls);
    expect(recorded.events).toEqual(plain.events);
    // o último quadro é a posição final
    const last = recorded.frames!.at(-1)!;
    pos.forEach((b, i) => {
      const end = plain.balls.find((x) => x.n === b.n);
      if (end) expect(last.data[i * 5]).toBe(end.x);
      else expect(Number.isNaN(last.data[i * 5])).toBe(true);
    });
  });
});
