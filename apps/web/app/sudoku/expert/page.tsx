import { VariationPage, variationMetadata } from "@/components/variacoes/VariationPage";

export const metadata = variationMetadata("/sudoku/expert");

export default function Page() {
  return <VariationPage path="/sudoku/expert" />;
}
