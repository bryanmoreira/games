// Enfeite do topo da home: luz de luminária sobre a mesa, atrás da placa do título. Só decoração (aria-hidden, sem clique).

export function TableDecor() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 -z-0 h-[420px] select-none overflow-hidden">
      {/* luz da luminária: some antes do fim, para não marcar faixa na cor do fundo */}
      <div className="absolute left-1/2 top-[-180px] h-[560px] w-[min(1100px,140vw)] -translate-x-1/2 rounded-[50%] bg-[radial-gradient(closest-side,rgba(242,193,78,0.14),rgba(15,81,50,0.18)_45%,transparent)]" />
    </div>
  );
}
