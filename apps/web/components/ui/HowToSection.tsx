/** Cartão numerado das páginas "Como jogar". */
export function Section({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-4 rounded-3xl bg-white/5 p-4 ring-1 ring-white/10 sm:p-6">
      <h2 className="flex items-center gap-3 font-display text-lg sm:text-xl">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gold text-sm text-stone-900">{n}</span>
        {title}
      </h2>
      {children}
    </section>
  );
}
