import { VariationPage, variationMetadata } from "@/components/variacoes/VariationPage";

export const metadata = variationMetadata("/sudoku/dificil");

export default function Page() {
  return <VariationPage path="/sudoku/dificil" />;
}
