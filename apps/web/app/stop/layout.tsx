import type { Metadata } from "next";

export const metadata: Metadata = { title: "Stop" };

/** Fundo de uma cor só (como o hub); cada página ocupa a altura toda. */
export default function StopLayout({ children }: { children: React.ReactNode }) {
  return <div className="flex min-h-dvh flex-col bg-[#0f1813] *:w-full *:flex-1">{children}</div>;
}
