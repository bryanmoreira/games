import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { HOME_CELLS, SAFE, TRACK_CELLS, startOf } from "@mesa/ludo";
import { fromFen } from "@mesa/xadrez";
import { PieceArt } from "@/components/xadrez/Piece";
import { TileFace } from "@/components/domino/Tile";
import { TijoladaArt } from "@/components/tijolada/Art";
import { SinucaArt } from "@/components/sinuca/Art";
import { getGame } from "@/lib/seo";
import { ART, ART_WORDS } from "@/components/caca-palavras/common";
import { ART_BARS, HEAT_COLOR } from "@/components/quente-ou-frio/WordBar";
import { ART_TILES, FACE, SIDE, TILE_RATIO } from "@/components/mahjong/common";
import { KIND_FILES } from "@mesa/mahjong";

/** Prévia de link (Open Graph) de cada jogo: arte do jogo à esquerda, nome à direita. */

export const OG_SIZE = { width: 1200, height: 630 };

const GOLD = "#f5b942";

/** Fontes do site (Bungee nos títulos, Inter no texto). Sem rede no build, cai na fonte padrão. */
async function googleFont(family: string): Promise<ArrayBuffer | null> {
  try {
    const css = await (await fetch(`https://fonts.googleapis.com/css2?family=${family}`)).text();
    const url = css.match(/src: url\((.+?)\) format\('(?:opentype|truetype)'\)/)?.[1];
    return url ? await (await fetch(url)).arrayBuffer() : null;
  } catch {
    return null;
  }
}

async function mahjongTile(kind: number): Promise<string> {
  const svg = await readFile(join(process.cwd(), "public/mahjong", `${KIND_FILES[kind]}.svg`));
  return `data:image/svg+xml;base64,${svg.toString("base64")}`;
}

async function card(name: string): Promise<string> {
  const png = await readFile(join(process.cwd(), "public/cards", `${name}.png`));
  return `data:image/png;base64,${png.toString("base64")}`;
}

const TITLES: Record<string, [string, string]> = {
  "truco-paulista": ["TRUCO", "PAULISTA"],
  buraco: ["BURACO", "CANASTRAS"],
  blackjack: ["BLACKJACK", "VINTE E UM"],
  "paciencia-spider": ["PACIÊNCIA", "SPIDER"],
  sudoku: ["SUDOKU", "9 × 9"],
  "connect-4": ["CONNECT", "4 EM LINHA"],
  stop: ["STOP", "ADEDONHA"],
  "batalha-naval": ["BATALHA", "NAVAL"],
  codenames: ["CODENAMES", "AGENTES SECRETOS"],
  otrio: ["OTRIO", "TRINCA DE ANÉIS"],
  "jogo-da-velha": ["VELHA", "JOGO DA VELHA"],
  damas: ["DAMAS", "CLÁSSICO"],
  xadrez: ["XADREZ", "XEQUE-MATE"],
  ludo: ["LUDO", "CORRIDA DE PEÕES"],
  domino: ["DOMINÓ", "BATIDA"],
  "futebol-de-botao": ["FUTEBOL", "DE BOTÃO"],
  sinuca: ["SINUCA", "BOLA 8"],
  tijolada: ["TIJOLADA", "SOLO E 1×1"],
  verbete: ["VERBETE", "PALAVRA DO DIA"],
  "caca-palavras": ["CAÇA", "PALAVRAS"],
  "quente-ou-frio": ["QUENTE", "OU FRIO"],
  mahjong: ["MAHJONG", "PACIÊNCIA"],
};

async function art(slug: string) {
  switch (slug) {
    case "truco-paulista": {
      const cards = await Promise.all(["4_of_clubs", "7_of_hearts", "ace_of_spades"].map(card));
      return (
        <div style={{ display: "flex", position: "relative", width: 420, height: 400 }}>
          {cards.map((src, i) => (
            <img
              key={i}
              src={src}
              width={190}
              height={276}
              style={{ position: "absolute", left: 115, top: 70, transformOrigin: "50% 100%", transform: `rotate(${(i - 1) * 18}deg)`, borderRadius: 12, boxShadow: "0 8px 20px rgba(0,0,0,0.45)" }}
            />
          ))}
        </div>
      );
    }
    case "buraco": {
      // sequência de copas em leque com o coringa no lugar do 8
      const cards = await Promise.all(["6_of_hearts", "7_of_hearts", "black_joker", "9_of_hearts"].map(card));
      return (
        <div style={{ display: "flex", position: "relative", width: 440, height: 420 }}>
          {cards.map((src, i) => (
            <img
              key={i}
              src={src}
              width={180}
              height={261}
              style={{ position: "absolute", left: 130, top: 80, transformOrigin: "50% 100%", transform: `rotate(${(i - 1.5) * 15}deg)`, borderRadius: 12, boxShadow: "0 8px 20px rgba(0,0,0,0.45)" }}
            />
          ))}
        </div>
      );
    }
    case "blackjack": {
      // ás e valete (blackjack) com uma ficha de 100 encostada
      const cards = await Promise.all(["ace_of_spades", "jack_of_hearts"].map(card));
      return (
        <div style={{ display: "flex", position: "relative", width: 440, height: 420 }}>
          {cards.map((src, i) => (
            <img
              key={i}
              src={src}
              width={200}
              height={290}
              style={{ position: "absolute", left: 70 + i * 110, top: 50 + i * 20, transform: `rotate(${i ? 10 : -10}deg)`, borderRadius: 12, boxShadow: "0 8px 20px rgba(0,0,0,0.45)" }}
            />
          ))}
          <div
            style={{
              position: "absolute",
              left: 300,
              top: 290,
              width: 110,
              height: 110,
              borderRadius: 55,
              background: "#1c1917",
              border: "10px dashed #f2c14e",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 8px 20px rgba(0,0,0,0.5)",
            }}
          >
            <div style={{ display: "flex", width: 64, height: 64, borderRadius: 32, border: "3px solid #f2c14e", alignItems: "center", justifyContent: "center", color: "#f2c14e", fontSize: 24, fontFamily: "Bungee" }}>
              100
            </div>
          </div>
        </div>
      );
    }
    case "paciencia-spider": {
      const cards = await Promise.all(["king_of_spades", "queen_of_spades", "jack_of_spades", "10_of_spades"].map(card));
      return (
        <div style={{ display: "flex", position: "relative", width: 240, height: 460 }}>
          {cards.map((src, i) => (
            <img key={i} src={src} width={220} height={320} style={{ position: "absolute", left: 10, top: i * 46, borderRadius: 12, boxShadow: "0 6px 16px rgba(0,0,0,0.45)" }} />
          ))}
        </div>
      );
    }
    case "mahjong": {
      // as mesmas peças da arte do site: três embaixo e o par de dragões por cima
      const W = 120;
      const H = W * TILE_RATIO;
      const lift = 11;
      const srcs = await Promise.all(ART_TILES.map((t) => mahjongTile(t.kind)));
      return (
        <div style={{ display: "flex", position: "relative", width: W * 3 + 30, height: H + 0.35 * W + 30, transform: "rotate(-3deg)" }}>
          {ART_TILES.map((t, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                position: "absolute",
                left: t.x * W + (t.top ? 0 : lift),
                top: t.y * W * TILE_RATIO + (t.top ? 0 : lift),
                width: W,
                height: H,
                borderRadius: 16,
                background: FACE,
                boxShadow: `4px 4px 0 ${SIDE[0]}, 8px 8px 0 ${SIDE[1]}, 12px 12px 0 ${SIDE[2]}, 14px 18px 18px rgba(0,0,0,0.45)`,
              }}
            >
              <img src={srcs[i]} width={W * 0.9} height={H * 0.9} style={{ position: "absolute", left: W * 0.05, top: H * 0.05 }} />
            </div>
          ))}
        </div>
      );
    }
    case "caca-palavras": {
      // a mesma grade da arte do site, com as cápsulas das palavras achadas (girada pelo transform de cada uma)
      const CELL = 66;
      const capsule = (from: number, to: number, color: string, i: number) => {
        const [r1, c1, r2, c2] = [Math.floor(from / 6), from % 6, Math.floor(to / 6), to % 6];
        const len = Math.hypot(r2 - r1, c2 - c1) * CELL + CELL * 0.8;
        const angle = (Math.atan2(r2 - r1, c2 - c1) * 180) / Math.PI;
        const cx = ((c1 + c2) / 2 + 0.5) * CELL;
        const cy = ((r1 + r2) / 2 + 0.5) * CELL;
        return (
          <div
            key={i}
            style={{
              display: "flex",
              position: "absolute",
              left: cx - len / 2,
              top: cy - CELL * 0.4,
              width: len,
              height: CELL * 0.8,
              borderRadius: CELL * 0.4,
              background: color,
              opacity: 0.6,
              transform: `rotate(${angle}deg)`,
            }}
          />
        );
      };
      return (
        <div style={{ display: "flex", padding: 14, background: "#5b3a1e", borderRadius: 26, transform: "rotate(-4deg)", boxShadow: "0 10px 24px rgba(0,0,0,0.5)" }}>
          <div style={{ display: "flex", position: "relative", width: CELL * 6, height: CELL * 6, background: "#1d4a73", borderRadius: 18 }}>
            {ART_WORDS.map((w, i) => capsule(w.from, w.to, w.color, i))}
            <div style={{ display: "flex", flexDirection: "column", position: "absolute", left: 0, top: 0 }}>
              {ART.map((row, r) => (
                <div key={r} style={{ display: "flex" }}>
                  {[...row].map((l, c) => (
                    <div key={c} style={{ display: "flex", width: CELL, height: CELL, alignItems: "center", justifyContent: "center", color: "white", fontSize: 34, fontFamily: "Bungee" }}>
                      {l}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }
    case "sudoku": {
      const puzzle = "53..7....6..195....98....6.8...6...34..8.3..17...2...6.6....28....419..5....8..79";
      const block = (b: number) => (
        <div key={b} style={{ display: "flex", flexWrap: "wrap", width: 126, height: 126, gap: 2 }}>
          {Array.from({ length: 9 }, (_, k) => {
            const r = Math.floor(b / 3) * 3 + Math.floor(k / 3);
            const c = (b % 3) * 3 + (k % 3);
            const v = puzzle[r * 9 + c];
            return (
              <div key={k} style={{ display: "flex", width: 40.6, height: 40.6, alignItems: "center", justifyContent: "center", background: "#14452b", color: "white", fontSize: 26, fontWeight: 700, fontFamily: "Inter" }}>
                {v === "." ? "" : v}
              </div>
            );
          })}
        </div>
      );
      return (
        <div style={{ display: "flex", flexWrap: "wrap", width: 398, gap: 4, padding: 6, background: "#5b3a1e", borderRadius: 16, transform: "rotate(-5deg)", boxShadow: "0 10px 24px rgba(0,0,0,0.5)" }}>
          {Array.from({ length: 9 }, (_, b) => block(b))}
        </div>
      );
    }
    case "connect-4": {
      const rows = [".......", ".......", "...y...", "..yr...", ".yrr.r.", "yrryry."];
      const color = { ".": "#0a1630", r: "#e5383b", y: "#f2c14e" } as const;
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: 10, padding: 16, background: "#2c5bc8", borderRadius: 22, transform: "rotate(3deg)", boxShadow: "0 10px 24px rgba(0,0,0,0.5)" }}>
          {rows.map((row, i) => (
            <div key={i} style={{ display: "flex", gap: 10 }}>
              {row.split("").map((c, j) => (
                <div key={j} style={{ display: "flex", width: 44, height: 44, borderRadius: 22, background: color[c as keyof typeof color], boxShadow: "inset 0 -4px 6px rgba(0,0,0,0.35)" }} />
              ))}
            </div>
          ))}
        </div>
      );
    }
    case "stop": {
      const answers = [["Nome", "Ana"], ["Animal", "Abelha"], ["Cor", "Amarelo"], ["Fruta", "Abacaxi"], ["CEP", "Amapá"]];
      return (
        <div style={{ display: "flex", position: "relative", width: 440, height: 420 }}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              position: "absolute",
              left: 110,
              top: 112,
              width: 320,
              padding: "14px 26px",
              borderRadius: 18,
              background: "#fbf6e9",
              color: "#44403c",
              transform: "rotate(3deg)",
              boxShadow: "0 12px 28px rgba(0,0,0,0.45)",
            }}
          >
            {answers.map(([cat, word], i) => (
              <div key={cat} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: i < answers.length - 1 ? "2px solid rgba(120,113,108,0.3)" : "none", fontSize: 26 }}>
                <span style={{ fontWeight: 500, color: "#78716c" }}>{cat}</span>
                <span style={{ fontWeight: 700 }}>{word}</span>
              </div>
            ))}
          </div>
          <div
            style={{
              display: "flex",
              position: "absolute",
              left: 0,
              top: 0,
              width: 130,
              height: 130,
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 26,
              background: "linear-gradient(160deg, #fbe6b0, #e9bf6a 60%, #d9a548)",
              color: "#5b3a1e",
              fontSize: 88,
              fontFamily: "Bungee",
              boxShadow: "0 10px 0 #9a6b12, 0 18px 30px rgba(0,0,0,0.45)",
              transform: "rotate(-8deg)",
            }}
          >
            A
          </div>
        </div>
      );
    }
    case "batalha-naval": {
      // navios (casas ocupadas), acertos e tiros na água
      const ship = new Set(["1,1", "1,2", "1,3", "1,4", "4,6", "5,6", "6,6", "7,2", "7,3", "2,8", "3,8", "8,8", "8,7"]);
      const hit = new Set(["1,2", "1,3", "5,6", "8,8"]);
      const miss = new Set(["2,5", "6,2", "0,7", "4,1", "9,4"]);
      return (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            width: 400,
            height: 400,
            borderRadius: 10,
            overflow: "hidden",
            background: "radial-gradient(ellipse at 30% 20%, #2378b0, #0d4473 55%, #072a48)",
            boxShadow: "0 0 0 6px #4a5866, 0 0 0 9px #262f38, 0 12px 28px rgba(0,0,0,0.5)",
            transform: "rotate(3deg)",
          }}
        >
          {Array.from({ length: 100 }, (_, k) => {
            const key = `${Math.floor(k / 10)},${k % 10}`;
            return (
              <div key={k} style={{ display: "flex", width: 40, height: 40, alignItems: "center", justifyContent: "center", borderRight: "1px solid rgba(255,255,255,0.13)", borderBottom: "1px solid rgba(255,255,255,0.13)" }}>
                {ship.has(key) && (
                  <div style={{ display: "flex", width: 34, height: 34, borderRadius: 6, background: "#9aa6b2", alignItems: "center", justifyContent: "center" }}>
                    {hit.has(key) && <div style={{ display: "flex", width: 18, height: 18, borderRadius: 9, background: "#e5383b", boxShadow: "0 0 10px #ff7b5c" }} />}
                  </div>
                )}
                {miss.has(key) && <div style={{ display: "flex", width: 10, height: 10, borderRadius: 5, background: "rgba(255,255,255,0.75)" }} />}
              </div>
            );
          })}
        </div>
      );
    }
    case "codenames": {
      // mesa 5×4 com algumas palavras reveladas
      const words = ["PRAIA", "GELO", "SOL", "BANCO", "PIRATA", "AREIA", "LOBO", "NEVE", "ONDA", "DISCO", "MÃO", "TREM", "CHAVE", "LUA", "FOGO", "ROSA", "BOLA", "REDE", "MEL", "TIGRE"];
      const revealed: Record<number, string> = { 2: "#d9463b", 7: "#2f6fd6", 11: "#cbb98c", 13: "#d9463b", 16: "#2f6fd6", 4: "#1c1917" };
      return (
        <div style={{ display: "flex", flexWrap: "wrap", width: 450, gap: 8, padding: 14, background: "#0b2b1b", borderRadius: 20, transform: "rotate(-4deg)", boxShadow: "0 12px 28px rgba(0,0,0,0.5)" }}>
          {words.map((w, i) => (
            <div
              key={w}
              style={{
                display: "flex",
                width: 78,
                height: 54,
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 9,
                background: revealed[i] ?? "#f3ead3",
                color: revealed[i] ? "rgba(255,255,255,0.75)" : "#292524",
                fontSize: 15,
                fontWeight: 700,
                fontFamily: "Inter",
                boxShadow: `0 4px 0 ${revealed[i] ? "rgba(0,0,0,0.35)" : "#b8a77c"}`,
              }}
            >
              {w}
            </div>
          ))}
        </div>
      );
    }
    case "otrio": {
      // casas linha a linha; cada letra é um tamanho (pequena, média, grande): r/b/g/p ou "." vazio
      const cells = ["r..", "..b", "..g", ".p.", "rrr", "", "p..", "b..", ".g."];
      const color = { r: "#e5484d", b: "#3e7bfa", g: "#2fb36b", p: "#a065e8" } as const;
      const radii = [16, 36, 56];
      const W = 11;
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: 6, padding: 16, background: "#9a6434", border: "4px solid #3b2412", borderRadius: 34, transform: "rotate(-3deg)", boxShadow: "0 10px 24px rgba(0,0,0,0.5)" }}>
          {[0, 1, 2].map((row) => (
            <div key={row} style={{ display: "flex", gap: 6 }}>
              {cells.slice(row * 3, row * 3 + 3).map((cell, i) => (
                <div key={i} style={{ display: "flex", position: "relative", width: 132, height: 132, borderRadius: 20, background: "rgba(40,20,5,0.2)" }}>
                  {radii.map((r, s) => {
                    const c = cell[s] as keyof typeof color | undefined;
                    const size = 2 * r + W;
                    return (
                      <div
                        key={s}
                        style={{
                          display: "flex",
                          position: "absolute",
                          left: 66 - size / 2,
                          top: 66 - size / 2,
                          width: size,
                          height: size,
                          borderRadius: size,
                          border: `${W}px solid ${c && c in color ? color[c] : "rgba(74,42,16,0.45)"}`,
                        }}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          ))}
        </div>
      );
    }
    case "jogo-da-velha": {
      // grade riscada a giz, X dourado e O vermelho, diagonal vencedora
      const cells = "XO.OX...X";
      const c = (i: number) => [(i % 3) * 100 + 50, Math.floor(i / 3) * 100 + 50];
      return (
        <div style={{ display: "flex", transform: "rotate(3deg)" }}>
          <svg width="420" height="420" viewBox="-10 -10 320 320" fill="none" strokeLinecap="round">
            {["M100 14Q105 150 98 286", "M201 12Q195 152 203 288", "M14 101Q150 95 286 99", "M12 199Q152 205 288 202"].map((d) => (
              <path key={d} d={d} stroke="rgba(255,255,255,0.85)" strokeWidth={7} />
            ))}
            {[...cells].map((m, i) => {
              const [x, y] = c(i);
              if (m === "X")
                return (
                  <g key={i} stroke="#f2c14e" strokeWidth={13}>
                    <path d={`M${x - 27} ${y - 28}Q${x} ${y - 2} ${x + 28} ${y + 27}`} />
                    <path d={`M${x + 27} ${y - 27}Q${x + 2} ${y} ${x - 28} ${y + 28}`} />
                  </g>
                );
              if (m === "O") return <circle key={i} cx={x} cy={y} r={30} stroke="#f87171" strokeWidth={13} />;
              return null;
            })}
            <path d="M22 22L278 278" stroke="#f2c14e" strokeWidth={10} />
          </svg>
        </div>
      );
    }
    case "damas": {
      // canto do tabuleiro com pedras e uma dama de cada cor
      const rows = ["", "..b.B...", ".b...b..", "....w...", ".....W..", "w.w.....", ".w......", ""];
      const piece = (p: string, x: number, y: number) => {
        const white = p.toLowerCase() === "w";
        return (
          <g key={`${x}-${y}`}>
            <circle cx={x + 25} cy={y + 28} r={21} fill="rgba(0,0,0,0.35)" />
            <circle cx={x + 25} cy={y + 25} r={21} fill={white ? "#c7ad7c" : "#0f0c0a"} />
            <circle cx={x + 25} cy={y + 23.5} r={20} fill={white ? "#f4e7cb" : "#2a2420"} />
            <circle cx={x + 25} cy={y + 23.5} r={15} fill="none" stroke={white ? "#d9c49b" : "#4a3f37"} strokeWidth={1.5} />
            {p === p.toUpperCase() && (
              <path d={`M${x + 15} ${y + 29}L${x + 13.5} ${y + 18}L${x + 19.5} ${y + 23}L${x + 25} ${y + 15}L${x + 30.5} ${y + 23}L${x + 36.5} ${y + 18}L${x + 35} ${y + 29}Z`} fill="#f2c14e" stroke="#8a5a12" strokeWidth={1.5} />
            )}
          </g>
        );
      };
      return (
        <div style={{ display: "flex", transform: "rotate(-4deg)", borderRadius: 18, padding: 12, background: "#5b3920", boxShadow: "0 12px 30px rgba(0,0,0,0.5)" }}>
          <svg width="400" height="400" viewBox="0 0 400 400">
            {Array.from({ length: 64 }, (_, i) => (
              <rect key={i} x={(i % 8) * 50} y={Math.floor(i / 8) * 50} width={50} height={50} fill={(Math.floor(i / 8) + (i % 8)) % 2 ? "#86552f" : "#e8cf9f"} />
            ))}
            {rows.flatMap((r, row) => [...r].flatMap((c, col) => (c === "." ? [] : [piece(c, col * 50, row * 50)])))}
          </svg>
        </div>
      );
    }
    case "xadrez": {
      // abertura italiana com as peças do jogo
      const board = fromFen("r1bqk1nr/pppp1ppp/2n5/2b1p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 0 1").board;
      return (
        <div style={{ display: "flex", transform: "rotate(-4deg)", borderRadius: 18, padding: 12, background: "#5b3920", boxShadow: "0 12px 30px rgba(0,0,0,0.5)" }}>
          <svg width="400" height="400" viewBox="0 0 400 400">
            {Array.from({ length: 64 }, (_, i) => (
              <rect key={i} x={(i % 8) * 50} y={Math.floor(i / 8) * 50} width={50} height={50} fill={(Math.floor(i / 8) + (i % 8)) % 2 ? "#a06c41" : "#ecd6ac"} />
            ))}
            {board.flatMap((p, i) =>
              p
                ? [
                    <g key={i} transform={`translate(${(i % 8) * 50 + 1} ${Math.floor(i / 8) * 50 + 1}) scale(0.48)`}>
                      {PieceArt({ p })}
                    </g>,
                  ]
                : [],
            )}
          </svg>
        </div>
      );
    }
    case "futebol-de-botao": {
      // campo visto de cima com os botões dos dois times e a bola
      const red = "#e5484d";
      const blue = "#3e7bfa";
      const discs: [number, number, string][] = [[170, 92, red], [95, 150, red], [235, 70, blue], [300, 118, blue]];
      return (
        <div style={{ display: "flex", transform: "rotate(-4deg)", borderRadius: 20, boxShadow: "0 12px 30px rgba(0,0,0,0.5)" }}>
          <svg width="460" height="260" viewBox="0 0 400 226">
            <rect width="400" height="226" rx="12" fill="#3f7f33" />
            {Array.from({ length: 8 }, (_, i) => (
              <rect key={i} x={24 + i * 44} y="16" width="44.5" height="194" fill={i % 2 ? "#4c9a3e" : "#55a646"} />
            ))}
            <rect x="6" y="85" width="18" height="56" fill="rgba(229,72,77,0.45)" stroke="#fff" strokeWidth="2" />
            <rect x="376" y="85" width="18" height="56" fill="rgba(62,123,250,0.45)" stroke="#fff" strokeWidth="2" />
            <rect x="24" y="16" width="352" height="194" fill="none" stroke="rgba(255,255,255,0.85)" strokeWidth="2.5" />
            <path d="M200 16V210" stroke="rgba(255,255,255,0.85)" strokeWidth="2.5" />
            <circle cx="200" cy="113" r="32" fill="none" stroke="rgba(255,255,255,0.85)" strokeWidth="2.5" />
            {discs.map(([x, y, c], i) => (
              <g key={i}>
                <circle cx={x + 2} cy={y + 3} r="15" fill="rgba(0,0,0,0.25)" />
                <circle cx={x} cy={y} r="15" fill={c} stroke={i === 0 ? "#fff" : "rgba(0,0,0,0.45)"} strokeWidth="3" />
              </g>
            ))}
            <circle cx="191" cy="104" r="8" fill="#fff" stroke="#111" strokeWidth="2" />
          </svg>
        </div>
      );
    }
    case "sinuca":
      // mesa vista de cima com a linha de mira até a 8, a caminho da caçapa do canto
      return (
        <div style={{ display: "flex", transform: "rotate(-3deg)", boxShadow: "0 14px 34px rgba(0,0,0,0.5)", borderRadius: 30 }}>
          {SinucaArt({ width: 520, height: 300 })}
        </div>
      );
    case "tijolada":
      // campo com as linhas de baixo quase cheias e um I caindo no buraco
      return (
        <div style={{ display: "flex", transform: "rotate(3deg)", boxShadow: "0 12px 30px rgba(0,0,0,0.5)", borderRadius: 24 }}>
          {TijoladaArt({ width: 300, height: 405 })}
        </div>
      );
    case "domino": {
      // pedaço de mesa: sena no meio, peças nas duas pontas e duas peças em pé
      const chain: [number, number, number, number, number][] = [
        [-3.5, 0, 90, 4, 2],
        [-1.5, 0, 90, 6, 4],
        [0, 0, 0, 6, 6],
        [1.5, 0, -90, 6, 3],
        [3, 0, 0, 3, 3],
      ];
      return (
        <div style={{ display: "flex", position: "relative", width: 460, height: 420 }}>
          <svg width="460" height="420" viewBox="-4.9 -4.2 9.8 9">
            {chain.map(([x, y, rot, a, b], i) => (
              <g key={i} transform={`translate(${x} ${y}) rotate(${rot})`}>
                {TileFace({ a, b })}
              </g>
            ))}
            <g transform="translate(-1.6 -2.6) rotate(-14) scale(1.25)">{TileFace({ a: 5, b: 5 })}</g>
            <g transform="translate(1.5 -2.4) rotate(12) scale(1.25)">{TileFace({ a: 1, b: 3 })}</g>
            <g transform="translate(-0.2 2.7) rotate(4) scale(1.25)">{TileFace({ a: 0, b: 2 })}</g>
          </svg>
        </div>
      );
    }
    case "ludo": {
      // tabuleiro em cruz com as 4 bases, peões no caminho e um dado
      const colors = ["#e5484d", "#2fb36b", "#f0b429", "#3e7bfa"];
      const corners = [[0, 0], [90, 0], [90, 90], [0, 90]];
      const pawns: [number, number, number][] = [[0, 6, 3], [3, 8, 6], [1, 2, 8], [2, 12, 8], [0, 7, 3]];
      return (
        <div style={{ display: "flex", position: "relative", transform: "rotate(-4deg)", borderRadius: 18, padding: 12, background: "#5b3920", boxShadow: "0 12px 30px rgba(0,0,0,0.5)" }}>
          <svg width="400" height="400" viewBox="0 0 150 150">
            <rect width="150" height="150" fill="#fffdf7" />
            {corners.map(([x, y], c) => (
              <g key={c}>
                <rect x={x} y={y} width="60" height="60" fill={colors[c]} />
                <rect x={x + 8} y={y + 8} width="44" height="44" rx="6" fill="#fffdf7" />
                {HOME_CELLS[c].map(([r, col], i) => (
                  <rect key={i} x={col * 10} y={r * 10} width="10" height="10" fill={colors[c]} stroke="#cdbf9f" strokeWidth="0.5" />
                ))}
              </g>
            ))}
            {TRACK_CELLS.map(([r, c], i) => {
              const start = [0, 1, 2, 3].find((col) => startOf(col) === i);
              return (
                <g key={i}>
                  <rect x={c * 10} y={r * 10} width="10" height="10" fill={start !== undefined ? colors[start] : "#fffdf7"} stroke="#cdbf9f" strokeWidth="0.5" />
                  {SAFE.has(i) && start === undefined && <circle cx={c * 10 + 5} cy={r * 10 + 5} r="2.4" fill="#c9b98f" />}
                </g>
              );
            })}
            <polygon points="60,60 60,90 75,75" fill={colors[0]} />
            <polygon points="60,60 90,60 75,75" fill={colors[1]} />
            <polygon points="90,60 90,90 75,75" fill={colors[2]} />
            <polygon points="60,90 90,90 75,75" fill={colors[3]} />
            {pawns.map(([c, row, col], i) => (
              <g key={i}>
                <circle cx={col * 10 + 5} cy={row * 10 + 6} r="4.4" fill="rgba(0,0,0,0.3)" />
                <circle cx={col * 10 + 5} cy={row * 10 + 5} r="4.2" fill={colors[c]} stroke="#1c1917" strokeWidth="0.8" />
                <circle cx={col * 10 + 4} cy={row * 10 + 3.8} r="1.3" fill="rgba(255,255,255,0.6)" />
              </g>
            ))}
          </svg>
          <div style={{ display: "flex", position: "absolute", right: -40, bottom: -30, transform: "rotate(14deg)" }}>
            <svg width="120" height="120" viewBox="0 0 100 100">
              <rect x="4" y="9" width="92" height="88" rx="20" fill="rgba(0,0,0,0.4)" />
              <rect x="4" y="4" width="92" height="88" rx="20" fill="#fffdf7" stroke="#d6cbb5" strokeWidth="3" />
              {[[28, 24], [72, 24], [28, 48], [72, 48], [28, 72], [72, 72]].map(([x, y], i) => (
                <circle key={i} cx={x} cy={y} r="9" fill="#1c1917" />
              ))}
            </svg>
          </div>
        </div>
      );
    }
    case "quente-ou-frio": {
      // os mesmos chutes do desenho da página (ART_BARS em components/quente-ou-frio/WordBar.tsx)
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: 18, width: 460, transform: "rotate(-3deg)" }}>
          {ART_BARS.map((b) => (
            <div
              key={b.word}
              style={{
                display: "flex",
                position: "relative",
                height: 84,
                alignItems: "center",
                borderRadius: 18,
                overflow: "hidden",
                background: "rgba(0,0,0,0.4)",
                boxShadow: "0 6px 14px rgba(0,0,0,0.4)",
                fontFamily: "Bungee",
                fontSize: 38,
                color: "white",
              }}
            >
              <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${b.pct}%`, background: HEAT_COLOR[b.heat], borderRadius: 18 }} />
              <div style={{ display: "flex", flex: 1, paddingLeft: 24 }}>{b.word}</div>
              <div style={{ display: "flex", paddingRight: 24 }}>{b.rank.toLocaleString("pt-BR")}</div>
            </div>
          ))}
        </div>
      );
    }
    case "verbete": {
      // chutes até VERBO, com as cores do jogo (MARK_BG em components/verbete/Tile.tsx)
      const color = { r: "#2a9d68", p: "#d39b26", a: "#2a2f2c" } as const;
      const rows: [string, string][] = [
        ["PORTA", "apraa"],
        ["SONHO", "aaaar"],
        ["VERSO", "rrrar"],
        ["VERBO", "rrrrr"],
      ];
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: 10, transform: "rotate(-4deg)" }}>
          {rows.map(([word, marks]) => (
            <div key={word} style={{ display: "flex", gap: 10 }}>
              {[...word].map((l, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    width: 78,
                    height: 78,
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: 10,
                    background: color[marks[i] as keyof typeof color],
                    color: marks[i] === "a" ? "rgba(255,255,255,0.55)" : "white",
                    fontFamily: "Bungee",
                    fontSize: 42,
                    boxShadow: "0 6px 14px rgba(0,0,0,0.4)",
                  }}
                >
                  {l}
                </div>
              ))}
            </div>
          ))}
        </div>
      );
    }
    default:
      return <div style={{ display: "flex" }} />;
  }
}

async function siteFonts() {
  const [bungee, inter, interBold] = await Promise.all([googleFont("Bungee"), googleFont("Inter:wght@500"), googleFont("Inter:wght@700")]);
  const fonts = [
    inter && { name: "Inter", data: inter, weight: 500 as const, style: "normal" as const },
    interBold && { name: "Inter", data: interBold, weight: 700 as const, style: "normal" as const },
    bungee && { name: "Bungee", data: bungee, weight: 400 as const, style: "normal" as const },
  ].filter((f) => !!f);
  return { display: bungee ? "Bungee" : "sans-serif", fonts };
}

/** Capa sem texto para os posts do blog: arte de um ou mais jogos no feltro. Gerada uma vez para `public/blog`. */
export async function blogCoverImage(games: string[]) {
  const scale = games.length === 1 ? 1.15 : games.length === 2 ? 0.85 : 0.68;
  const arts = await Promise.all(games.map(art));
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "radial-gradient(circle at 50% 45%, #1d6b43 0%, #0f3a24 60%, #0b1f15 100%)",
          border: "14px solid #5b3a1e",
        }}
      >
        {arts.map((a, i) => (
          <div
            key={i}
            style={{ display: "flex", width: 1100 / games.length, height: "100%", alignItems: "center", justifyContent: "center", transform: `scale(${scale})` }}
          >
            {a}
          </div>
        ))}
      </div>
    ),
    OG_SIZE,
  );
}

/** Prévia de link de um post do blog: arte do jogo (quando houver) e o título do post. */
export async function blogOgImage(title: string, game: string) {
  const { display, fonts } = await siteFonts();
  const hasArt = game in TITLES;
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          background: "radial-gradient(circle at 35% 45%, #1d6b43 0%, #0f3a24 60%, #0b1f15 100%)",
          border: "14px solid #5b3a1e",
          padding: hasArt ? "0 60px 0 20px" : "0 80px",
          fontFamily: "Inter",
        }}
      >
        {hasArt && (
          <div style={{ display: "flex", width: 440, height: "100%", alignItems: "center", justifyContent: "center", transform: "scale(0.85)" }}>
            {await art(game)}
          </div>
        )}
        <div style={{ display: "flex", flex: 1, flexDirection: "column", alignItems: hasArt ? "flex-start" : "center", textAlign: hasArt ? "left" : "center" }}>
          <div style={{ display: "flex", fontFamily: display, fontSize: 30, letterSpacing: 10, color: "rgba(255,255,255,0.7)" }}>BLOG</div>
          <div style={{ display: "flex", marginTop: 18, fontFamily: display, fontSize: title.length > 48 ? 54 : 64, lineHeight: 1.1, color: GOLD, textShadow: "0 5px 0 #7a4e0c" }}>
            {title}
          </div>
          <div style={{ display: "flex", marginTop: 36, padding: "10px 26px", borderRadius: 999, background: "rgba(0,0,0,0.35)", fontSize: 28, fontWeight: 700, color: GOLD }}>
            mesadejogos.com
          </div>
        </div>
      </div>
    ),
    { ...OG_SIZE, fonts },
  );
}

export async function gameOgImage(slug: string) {
  const g = getGame(slug);
  const [title, sub] = TITLES[slug];
  const { display, fonts } = await siteFonts();
  const titleSize = Math.min(124, Math.floor(600 / (title.length * 0.82)));

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          background: "radial-gradient(circle at 35% 45%, #1d6b43 0%, #0f3a24 60%, #0b1f15 100%)",
          border: "14px solid #5b3a1e",
          padding: "0 60px 0 40px",
          fontFamily: "Inter",
        }}
      >
        <div style={{ display: "flex", width: 500, height: "100%", alignItems: "center", justifyContent: "center" }}>{await art(slug)}</div>
        <div style={{ display: "flex", flex: 1, flexDirection: "column", alignItems: "center", textAlign: "center" }}>
          <div style={{ display: "flex", fontFamily: display, fontSize: titleSize, lineHeight: 1, color: GOLD, textShadow: "0 6px 0 #7a4e0c" }}>{title}</div>
          <div style={{ display: "flex", marginTop: 18, fontFamily: display, fontSize: 34, letterSpacing: 12, color: "rgba(255,255,255,0.85)" }}>{sub}</div>
          <div style={{ display: "flex", marginTop: 36, fontSize: 32, fontWeight: 500, lineHeight: 1.3, color: "rgba(255,255,255,0.8)", maxWidth: 560, justifyContent: "center" }}>{g.tagline}</div>
          <div style={{ display: "flex", marginTop: 40, padding: "10px 26px", borderRadius: 999, background: "rgba(0,0,0,0.35)", fontSize: 28, fontWeight: 700, color: GOLD }}>
            mesadejogos.com
          </div>
        </div>
      </div>
    ),
    { ...OG_SIZE, fonts },
  );
}
