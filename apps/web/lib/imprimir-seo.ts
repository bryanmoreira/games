import type { Metadata } from "next";
import { breadcrumbLd, SITE_NAME } from "@/lib/seo";
import { CACA_PATH } from "@/lib/caca-palavras/paths";
import { SUDOKU_PATH } from "@/lib/sudoku/paths";
import { CACA_PRINT_PATH, SUDOKU_PRINT_PATH } from "@/lib/imprimir";

// Títulos, descrições e JSON-LD das folhas para imprimir.

export function printMetadata(path: string, title: string, description: string, keywords: string[], og: string): Metadata {
  // o layout do jogo tem título próprio, então o template do layout raiz não chega aqui
  const full = `${title} · ${SITE_NAME}`;
  return {
    title: full,
    description,
    keywords,
    alternates: { canonical: path },
    openGraph: { title: full, description, url: path, siteName: SITE_NAME, locale: "pt_BR", type: "article", images: [`${og}/opengraph-image`] },
    twitter: { card: "summary_large_image", title: full, description, images: [`${og}/opengraph-image`] },
  };
}

const GAME = { sudoku: { name: "Sudoku", path: SUDOKU_PATH, print: SUDOKU_PRINT_PATH }, caca: { name: "Caça-Palavras", path: CACA_PATH, print: CACA_PRINT_PATH } };

export function printLd(game: keyof typeof GAME, extra?: { name: string; path: string }) {
  const g = GAME[game];
  return {
    "@context": "https://schema.org",
    "@graph": [
      breadcrumbLd([
        { name: SITE_NAME, path: "/" },
        { name: g.name, path: g.path },
        { name: "Para imprimir", path: g.print },
        ...(extra ? [extra] : []),
      ]),
    ],
  };
}
