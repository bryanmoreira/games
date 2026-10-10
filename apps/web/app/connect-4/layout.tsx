import type { Metadata } from "next";

export const metadata: Metadata = { title: "Connect 4" };

export default function Connect4Layout({ children }: { children: React.ReactNode }) {
  return children;
}
