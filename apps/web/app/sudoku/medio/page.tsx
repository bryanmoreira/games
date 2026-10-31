import { VariationPage, variationMetadata } from "@/components/variacoes/VariationPage";

export const metadata = variationMetadata("/sudoku/medio");

export default function Page() {
  return <VariationPage path="/sudoku/medio" />;
}
