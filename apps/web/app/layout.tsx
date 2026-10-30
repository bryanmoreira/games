import type { Metadata, Viewport } from "next";
import { Atkinson_Hyperlegible, Bungee, Inter } from "next/font/google";
import { connection } from "next/server";
import { FONT_SCRIPT } from "@/lib/fontPref";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/seo";
import { AccountSync } from "@/components/AccountSync";
import { Presence } from "@/components/Presence";
import { GameInvites } from "@/components/GameInvites";
import { ChipRewards } from "@/components/chips/ChipRewards";
import { InstallApp } from "@/components/InstallApp";
import "./globals.css";

const bungee = Bungee({ weight: "400", subsets: ["latin"], variable: "--font-bungee" });
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
// só baixa se o jogador escolher a fonte "Legível"
const atkinson = Atkinson_Hyperlegible({ weight: ["400", "700"], subsets: ["latin"], variable: "--font-atkinson", preload: false });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "Mesa de Jogos: Truco, Stop, Batalha Naval e mais jogos online grátis", template: `%s · ${SITE_NAME}` },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: ["jogos online grátis", "jogos de cartas online", "truco online", "stop online", "adedonha online", "batalha naval online", "connect 4 online", "sudoku online", "paciência spider", "caça-palavras online", "mahjong online", "jogos com amigos"],
  openGraph: { siteName: SITE_NAME, locale: "pt_BR", type: "website", title: SITE_NAME, description: SITE_DESCRIPTION },
  twitter: { card: "summary_large_image", title: SITE_NAME, description: SITE_DESCRIPTION },
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/pwa-icon/192", type: "image/png", sizes: "192x192" },
    ],
    apple: "/pwa-icon/apple",
  },
  appleWebApp: { capable: true, title: SITE_NAME, statusBarStyle: "black" },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 } },
  other: { "geo.region": "BR", "content-language": "pt-BR" },
};
export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#0f1813" };

// Lido no runtime (não no build): chave dinâmica evita que o Next embuta NEXT_PUBLIC_* no bundle
function runtimeEnv(name: string): string | undefined {
  return process.env[name] || undefined;
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  await connection();
  const adsense = runtimeEnv("ADSENSE_CLIENT");
  const env = {
    WS_URL: runtimeEnv("WS_URL") ?? runtimeEnv(["NEXT_PUBLIC", "WS_URL"].join("_")) ?? "",
    ADSENSE_CLIENT: adsense,
    ADSENSE_SLOT: runtimeEnv("ADSENSE_SLOT"),
  };
  const script = `window.__ENV__=${JSON.stringify(env).replace(/</g, "\\u003c")}`;

  return (
    <html lang="pt-BR" className={`${bungee.variable} ${inter.variable} ${atkinson.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: FONT_SCRIPT }} />
        <script dangerouslySetInnerHTML={{ __html: script }} />
        {/* verificação do site no AdSense; o script de anúncios só carrega nas páginas com AdSlot */}
        {adsense && <meta name="google-adsense-account" content={adsense} />}
        <script defer src="https://umami.sunfire.com.br/script.js" data-website-id="fc7700da-1558-4ba9-9882-ab404f12129e" />
      </head>
      <body className="antialiased">
        <AccountSync />
        <Presence />
        <GameInvites />
        <ChipRewards />
        {children}
      </body>
    </html>
  );
}
