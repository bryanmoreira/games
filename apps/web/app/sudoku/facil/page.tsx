import { VariationPage, variationMetadata } from "@/components/variacoes/VariationPage";

export const metadata = variationMetadata("/sudoku/facil");

export default function Page() {
  return <VariationPage path="/sudoku/facil" />;
}
