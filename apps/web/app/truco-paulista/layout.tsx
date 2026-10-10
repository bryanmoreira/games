import type { Metadata } from "next";

export const metadata: Metadata = { title: "Truco Paulista" };

export default function TrucoLayout({ children }: { children: React.ReactNode }) {
  return children;
}
