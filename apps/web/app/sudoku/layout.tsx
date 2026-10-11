import { JsonLd } from "@/components/seo";
import { gameLd, gameMetadata } from "@/lib/seo";

export const metadata = gameMetadata("sudoku");

export default function SudokuLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd data={gameLd("sudoku")} />
      {children}
    </>
  );
}
