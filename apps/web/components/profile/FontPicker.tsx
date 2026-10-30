"use client";

import { useEffect, useState } from "react";
import { FONTS, getFont, setFont, type FontId } from "@/lib/fontPref";

/** Escolhe a fonte do site todo; cada opção mostra um "Aa" na própria fonte. */
export function FontPicker() {
  const [font, setCurrent] = useState<FontId>("padrao");
  useEffect(() => setCurrent(getFont()), []);

  const pick = (id: FontId) => {
    setFont(id);
    setCurrent(id);
  };

  return (
    <div role="radiogroup" aria-label="Fonte do site" className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {FONTS.map((f) => {
        const on = f.id === font;
        return (
          <button
            key={f.id}
            role="radio"
            aria-checked={on}
            onClick={() => pick(f.id)}
            className={`flex flex-col items-center gap-1 rounded-xl px-2 py-3 ring-1 transition ${on ? "bg-gold/15 text-gold ring-gold/60" : "bg-white/5 text-white/80 ring-white/10 hover:bg-white/10"}`}
          >
            <span className="text-2xl leading-none" style={{ fontFamily: f.family, fontWeight: f.id === "padrao" ? 400 : 700 }}>
              Aa
            </span>
            <span className="text-xs" style={{ fontFamily: f.id === "padrao" ? "var(--font-inter)" : f.family }}>
              {f.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
