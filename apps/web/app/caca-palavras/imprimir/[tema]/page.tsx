import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { THEMES } from "@mesa/caca-palavras";
import { CacaGrid, OptionLinks, Paper, PrintShell, Section, WordChecklist } from "@/components/imprimir/Sheets";
import { CACA_LEVELS, CACA_PRINT_PATH, cacaLevel, cacaPrintPath, cacaSheet, cacaTheme, DEFAULT_CACA_LEVEL, themeInText, MAX_SHEET, sheetOf } from "@/lib/imprimir";
import { printLd, printMetadata } from "@/lib/imprimir-seo";
import { CACA_PATH, CACA_PLAY_PATH } from "@/lib/caca-palavras/paths";

type Props = { params: Promise<{ tema: string }>; searchParams: Promise<{ nivel?: string; folha?: string }> };

export function generateStaticParams() {
  return THEMES.map((t) => ({ tema: t.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const t = cacaTheme((await params).tema);
  if (!t) return {};
  const name = themeInText(t);
  return printMetadata(
    cacaPrintPath(t.id),
    `Caça-palavras ${name} para imprimir (com gabarito)`,
    `Caça-palavras ${name} para imprimir em A4 ou salvar em PDF, nos níveis fácil, médio e difícil, com gabarito. Grátis, bom para a escola e para passar o tempo.`,
    [`caça-palavras ${name}`, `caça-palavras ${name} para imprimir`, "caça-palavras para imprimir", "caça-palavras pdf", "caça-palavras com gabarito"],
    CACA_PATH,
  );
}

export default async function CacaPrint({ params, searchParams }: Props) {
  const t = cacaTheme((await params).tema);
  if (!t) notFound();
  const q = await searchParams;
  const level = cacaLevel(q.nivel);
  const sheet = sheetOf(q.folha);
  const p = cacaSheet(t.id, level.level, sheet);
  const href = (nivel: string, folha = 1) => {
    const qs = new URLSearchParams();
    if (nivel !== DEFAULT_CACA_LEVEL.slug) qs.set("nivel", nivel);
    if (folha > 1) qs.set("folha", String(folha));
    const s = qs.toString();
    return `${cacaPrintPath(t.id)}${s ? `?${s}` : ""}`;
  };
  const title = `Caça-palavras: ${t.name}`;

  return (
    <PrintShell
      back={CACA_PRINT_PATH}
      kicker="PARA IMPRIMIR"
      title={`Caça-palavras ${themeInText(t)}`}
      intro={
        <>
          {p.words.length} palavras {themeInText(t)} escondidas na grade, com o gabarito na página seguinte. Nível {level.name.toLowerCase()}: {level.hint}.
        </>
      }
      options={
        <div className="flex flex-col items-center gap-3">
          <OptionLinks label="Nível" items={CACA_LEVELS.map((l) => ({ href: href(l.slug), text: l.name, active: l.slug === level.slug }))} />
          <OptionLinks label={`Folha ${sheet}`} items={[{ href: href(level.slug, sheet >= MAX_SHEET ? 1 : sheet + 1), text: "Outra folha" }]} />
        </div>
      }
      what={`caca-${t.id}`}
      ld={printLd("caca", { name: `Caça-palavras ${themeInText(t)}`, path: cacaPrintPath(t.id) })}
      sheets={
        <div className="flex flex-col gap-6 print:block">
          <Paper title={title} subtitle={`Nível ${level.name.toLowerCase()} · folha ${sheet} · ache as ${p.words.length} palavras e risque na lista`}>
            <CacaGrid p={p} />
            <WordChecklist words={p.words.map((w) => w.word)} />
          </Paper>
          <Paper title={`${title}: gabarito`} subtitle={`Nível ${level.name.toLowerCase()} · folha ${sheet}`} last>
            <CacaGrid p={p} solved />
          </Paper>
        </div>
      }
    >
      <Section title="Outros temas">
        <ul className="flex flex-wrap justify-center gap-2">
          {THEMES.filter((x) => x.id !== t.id).map((x) => (
            <li key={x.id}>
              <Link href={cacaPrintPath(x.id)} className="rounded-full bg-black/30 px-3 py-1.5 text-sm text-white/80 ring-1 ring-white/10 transition hover:text-gold">
                {x.name}
              </Link>
            </li>
          ))}
        </ul>
      </Section>
      <Section title="Prefere jogar na tela?">
        <Link href={CACA_PLAY_PATH} className="mx-auto rounded-xl bg-white/10 px-6 py-3 font-display text-white/90 transition hover:bg-white/20">
          Jogar Caça-Palavras online
        </Link>
      </Section>
    </PrintShell>
  );
}
