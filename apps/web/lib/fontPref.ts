// Fonte do site escolhida pelo jogador (fica no navegador). O <html data-font> troca as variáveis do globals.css.

export const FONT_KEY = "mesa-font";

export const FONTS = [
  { id: "padrao", label: "Padrão", family: "var(--font-bungee)" },
  { id: "simples", label: "Simples", family: "var(--font-inter)" },
  { id: "legivel", label: "Legível", family: "var(--font-atkinson)" },
  { id: "sistema", label: "Do aparelho", family: "system-ui" },
] as const;

export type FontId = (typeof FONTS)[number]["id"];

/** Roda no <head> antes da página aparecer, para não piscar a fonte padrão. */
export const FONT_SCRIPT = `try{var f=localStorage.getItem("${FONT_KEY}");if(f&&f!=="padrao")document.documentElement.dataset.font=f}catch(e){}`;

export function getFont(): FontId {
  try {
    const f = localStorage.getItem(FONT_KEY);
    if (FONTS.some((o) => o.id === f)) return f as FontId;
  } catch {}
  return "padrao";
}

export function setFont(id: FontId) {
  try {
    if (id === "padrao") localStorage.removeItem(FONT_KEY);
    else localStorage.setItem(FONT_KEY, id);
  } catch {}
  if (id === "padrao") delete document.documentElement.dataset.font;
  else document.documentElement.dataset.font = id;
}
