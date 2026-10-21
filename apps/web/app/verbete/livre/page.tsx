import { isMode, type Mode } from "@mesa/verbete";
import { Table } from "@/components/verbete/Table";

/** Modo livre: palavras sorteadas. `?m=2` ou `?m=4` para Dueto e Quarteto. */
export default async function VerbeteFree({ searchParams }: { searchParams: Promise<{ m?: string }> }) {
  const m = Number((await searchParams).m);
  const mode: Mode = isMode(m) ? m : 1;
  return <Table key={mode} mode={mode} />;
}
