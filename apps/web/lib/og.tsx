import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { getGame } from "@/lib/seo";

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

async function card(name: string): Promise<string> {
  const png = await readFile(join(process.cwd(), "public/cards", `${name}.png`));
  return `data:image/png;base64,${png.toString("base64")}`;
}

const TITLES: Record<string, [string, string]> = {
  "truco-paulista": ["TRUCO", "PAULISTA"],
  "paciencia-spider": ["PACIÊNCIA", "SPIDER"],
  sudoku: ["SUDOKU", "9 × 9"],
  "connect-4": ["CONNECT", "4 EM LINHA"],
  stop: ["STOP", "ADEDONHA"],
  "batalha-naval": ["BATALHA", "NAVAL"],
  codenames: ["CODENAMES", "AGENTES SECRETOS"],
  otrio: ["OTRIO", "TRINCA DE ANÉIS"],
  "jogo-da-velha": ["VELHA", "JOGO DA VELHA"],
  damas: ["DAMAS", "CLÁSSICO"],
  verbete: ["VERBETE", "PALAVRA DO DIA"],
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

export async function gameOgImage(slug: string) {
  const g = getGame(slug);
  const [title, sub] = TITLES[slug];
  const [bungee, inter, interBold] = await Promise.all([googleFont("Bungee"), googleFont("Inter:wght@500"), googleFont("Inter:wght@700")]);
  const display = bungee ? "Bungee" : "sans-serif";
  const fonts = [
    inter && { name: "Inter", data: inter, weight: 500 as const, style: "normal" as const },
    interBold && { name: "Inter", data: interBold, weight: 700 as const, style: "normal" as const },
    bungee && { name: "Bungee", data: bungee, weight: 400 as const, style: "normal" as const },
  ].filter((f) => !!f);
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
