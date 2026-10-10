import type { Metadata, Viewport } from "next";
import { Bungee, Inter } from "next/font/google";
import "./globals.css";

const bungee = Bungee({ weight: "400", subsets: ["latin"], variable: "--font-bungee" });
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = { title: "Truco" };
export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#0b120e" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${bungee.variable} ${inter.variable}`}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
