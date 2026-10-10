import type { Metadata } from "next";

export const metadata: Metadata = { title: "Truco" };

export default function TrucoLayout({ children }: { children: React.ReactNode }) {
  return children;
}
