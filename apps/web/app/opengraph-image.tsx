import { ImageResponse } from "next/og";

export const alt = "Mesa de Jogos: Truco, Stop, Batalha Naval, Connect 4, Sudoku e Paciência Spider online";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "radial-gradient(circle at 50% 40%, #1d6b43 0%, #0f3a24 55%, #0b120e 100%)",
          border: "14px solid #5b3a1e",
        }}
      >
        <div style={{ display: "flex", fontSize: 128, fontWeight: 900, color: "#f5b942", letterSpacing: 4, textShadow: "0 6px 0 #7a4e0c" }}>MESA DE JOGOS</div>
        <div style={{ display: "flex", marginTop: 28, fontSize: 40, color: "rgba(255,255,255,0.85)" }}>Truco · Stop · Batalha Naval · Connect 4 · Sudoku · Spider</div>
        <div style={{ display: "flex", marginTop: 20, fontSize: 32, color: "rgba(255,255,255,0.55)" }}>mesadejogos.com</div>
      </div>
    ),
    size,
  );
}
