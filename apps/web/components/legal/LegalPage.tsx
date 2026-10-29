import Link from "next/link";
import { BackButton } from "@/components/BackButton";
import { SiteFooter } from "@/components/SiteFooter";
import { LEGAL_EMAIL, LEGAL_UPDATED, PRIVACY_PATH, TERMS_PATH } from "@/lib/legal";

/** Página de texto (Privacidade, Termos, Sobre, Contato): título, data da versão e seções em cartões. */
export function LegalPage({ title, dated = true, children }: { title: string; dated?: boolean; children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-[#0f1813]">
      <main className="mx-auto flex max-w-3xl flex-col gap-4 px-4 py-8 sm:py-12">
        <header className="relative mb-2 flex flex-col items-center gap-1">
          <BackButton href="/" className="absolute left-0 top-1/2 -translate-y-1/2" />
          <h1 className="px-12 text-center font-display text-2xl text-gold sm:text-4xl">{title}</h1>
          {dated && <span className="text-xs text-white/45">Atualizado em {LEGAL_UPDATED}</span>}
        </header>
        {children}
        <p className="mt-2 text-center text-xs text-white/45">
          Dúvidas? <Email />
        </p>
      </main>
      <SiteFooter />
    </div>
  );
}

export function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3 rounded-3xl bg-white/5 p-4 text-sm leading-relaxed text-white/70 ring-1 ring-white/10 sm:p-6 [&_b]:font-semibold [&_b]:text-white/90 [&_ul]:flex [&_ul]:list-disc [&_ul]:flex-col [&_ul]:gap-1.5 [&_ul]:pl-5">
      <h2 className="font-display text-base text-gold sm:text-lg">{title}</h2>
      {children}
    </section>
  );
}

export function Email() {
  return (
    <a href={`mailto:${LEGAL_EMAIL}`} className="text-gold underline-offset-4 hover:underline">
      {LEGAL_EMAIL}
    </a>
  );
}

/** Links discretos para as duas páginas (rodapé da home, tela de login, conta). */
export function LegalLinks({ className = "" }: { className?: string }) {
  const cls = "underline-offset-4 hover:text-gold hover:underline";
  return (
    <nav aria-label="Informações legais" className={`flex justify-center gap-4 text-xs text-white/40 ${className}`}>
      <Link href={PRIVACY_PATH} className={cls}>
        Privacidade
      </Link>
      <Link href={TERMS_PATH} className={cls}>
        Termos de uso
      </Link>
    </nav>
  );
}
