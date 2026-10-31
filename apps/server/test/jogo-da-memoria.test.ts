import { expect, test } from "bun:test";
import { newGame, applyAction } from "@mesa/jogo-da-memoria";
import { GAMES } from "../src/games";

test("adaptador da memória: mesa de dois, resultado e números próprios", () => {
  let s = newGame(() => .5, [0,1], { level: "easy" }, null, 1000);
  s.deck = Array.from({length:30},(_,i) => Math.floor(i/2));
  for (let i=0; i<30; i+=2) {
    s.turn = i<16 ? 0 : 1;
    for (const a of [{type:"flip" as const,seat:s.turn,index:i},{type:"flip" as const,seat:s.turn,index:i+1},{type:"advance" as const}]) {
      const r = applyAction(s,a,11_000); if(!r.ok) throw Error(r.error); s=r.state;
    }
  }
  expect(GAMES["jogo-da-memoria"].seats).toBe(2);
  expect(GAMES["jogo-da-memoria"].outcome(s,0)).toMatchObject({outcome:"win",placement:1,data:{pairs:8, attempts:8,mistakes:0,players:2,level:"easy",timeMs:10_000}});
  expect(GAMES["jogo-da-memoria"].outcome(s,1)).toMatchObject({outcome:"loss",placement:2,data:{pairs:7}});
});

test("adaptador injeta lugar e não permite advance nem coagir índices do cliente", () => {
  const g = GAMES["jogo-da-memoria"];
  const s = g.newGame(null,{seats:[0,1],settings:null});
  expect(g.settings).toBeUndefined();
  expect(g.newGame(null,{seats:[0,1],settings:{level:"hard"}}).settings.level).toBe("easy");
  expect(g.withSeat({type:"flip",index:4,seat:1},0)).toEqual({type:"flip",index:4,seat:0});
  for (const raw of [null,{}, {type:"advance"},{type:"flip",index:"4"}]) expect(g.applyAction(s,g.withSeat(raw,0)).ok).toBe(false);
  expect(g.animMs(null,s)).toBeGreaterThan(1000);
  expect(g.spectate!(s).cards.every((x: unknown) => x===null)).toBe(true);
});
