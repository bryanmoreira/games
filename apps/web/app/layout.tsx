import type { Metadata, Viewport } from "next";
import { Bungee, Inter } from "next/font/google";
import { connection } from "next/server";
import "./globals.css";

const bungee = Bungee({ weight: "400", subsets: ["latin"], variable: "--font-bungee" });
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = { title: "Jogos" };
export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#0b120e" };

// Lido no runtime (não no build): chave dinâmica evita que o Next embuta NEXT_PUBLIC_* no bundle
function runtimeEnv(name: string): string | undefined {
  return process.env[name] || undefined;
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  await connection();
  const env = { WS_URL: runtimeEnv("WS_URL") ?? runtimeEnv(["NEXT_PUBLIC", "WS_URL"].join("_")) ?? "" };
  const script = `window.__ENV__=${JSON.stringify(env).replace(/</g, "\\u003c")}`;

  return (
    <html lang="pt-BR" className={`${bungee.variable} ${inter.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: script }} />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
