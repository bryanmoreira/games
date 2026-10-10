import type { Metadata } from "next";

export const metadata: Metadata = { title: "Paciência Spider" };

export default function SpiderLayout({ children }: { children: React.ReactNode }) {
  return children;
}
