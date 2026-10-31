"use client";

import { withRef } from "@/lib/referral";
import { Icon } from "@/components/ui/buttons";

export function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <Icon className={className}>
      <path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21" />
      <path d="M9 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1a5 5 0 0 0 5 5h1a.5.5 0 0 0 0-1h-1a.5.5 0 0 0 0 1" />
    </Icon>
  );
}

/**
 * Abre o WhatsApp com uma mensagem pronta e o link da página atual (com UTM para o Umami saber que veio de convite).
 * `message` recebe a URL final e devolve o texto.
 */
export function WhatsAppInvite({
  campaign,
  message,
  label = "Convidar",
  className = "",
}: {
  campaign: string;
  message: (url: string) => string;
  label?: string;
  className?: string;
}) {
  const open = () => {
    const url = withRef(`${location.origin}${location.pathname}?utm_source=whatsapp&utm_medium=convite&utm_campaign=${campaign}`);
    window.open(`https://wa.me/?text=${encodeURIComponent(message(url))}`, "_blank", "noopener,noreferrer");
  };

  return (
    <button
      onClick={open}
      data-umami-event="convite-whatsapp"
      data-umami-event-jogo={campaign}
      className={`flex items-center justify-center gap-2 rounded-full bg-[#25d366] px-5 py-2.5 font-display text-stone-900 shadow-[0_4px_0_#128c4b] transition active:translate-y-1 active:shadow-none ${className}`}
    >
      <WhatsAppIcon className="h-5 w-5" />
      {label}
    </button>
  );
}
