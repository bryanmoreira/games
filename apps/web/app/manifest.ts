import type { MetadataRoute } from "next";
import { SITE_DESCRIPTION, SITE_NAME } from "@/lib/seo";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE_NAME,
    short_name: SITE_NAME,
    description: SITE_DESCRIPTION,
    lang: "pt-BR",
    start_url: "/",
    display: "standalone",
    background_color: "#0f1813",
    theme_color: "#0f1813",
    categories: ["games"],
    id: "/",
    scope: "/",
    orientation: "any",
    icons: [
      { src: "/pwa-icon/192", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/pwa-icon/512", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/pwa-icon/maskable", sizes: "512x512", type: "image/png", purpose: "maskable" },
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
    ],
    screenshots: [
      { src: "/screenshots/home-wide.png", sizes: "1280x720", type: "image/png", form_factor: "wide", label: "Todos os jogos da Mesa" },
      { src: "/screenshots/truco-wide.png", sizes: "1280x720", type: "image/png", form_factor: "wide", label: "Truco paulista" },
      { src: "/screenshots/home-narrow.png", sizes: "540x960", type: "image/png", form_factor: "narrow", label: "Todos os jogos da Mesa" },
      { src: "/screenshots/truco-narrow.png", sizes: "540x960", type: "image/png", form_factor: "narrow", label: "Truco paulista" },
    ],
  };
}
