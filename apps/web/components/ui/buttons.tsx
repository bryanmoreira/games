"use client";

import { useEffect, useState } from "react";
import { isMuted, setMuted } from "@/lib/sound";

/** Botão redondo de ícone do topo da mesa. */
export function IconButton({
  label,
  onClick,
  active,
  disabled,
  className = "",
  children,
}: {
  label: string;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      aria-pressed={active}
      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition disabled:opacity-30 sm:h-10 sm:w-10 ${
        active ? "bg-gold/20 text-gold enabled:hover:bg-gold/30" : "bg-white/10 text-white/80 enabled:hover:bg-white/20 enabled:hover:text-white"
      } ${className}`}
    >
      {children}
    </button>
  );
}

export function Icon({ children, className = "h-5 w-5" }: { children: React.ReactNode; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={2.25}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export function XIcon() {
  return (
    <Icon>
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </Icon>
  );
}

export function HelpButton({ onClick }: { onClick: () => void }) {
  return (
    <IconButton label="Como jogar" onClick={onClick}>
      <Icon>
        <path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3" />
        <path d="M12 17h.01" />
      </Icon>
    </IconButton>
  );
}

export function ExitButton({ onClick }: { onClick: () => void }) {
  return (
    <IconButton label="Sair" onClick={onClick}>
      <XIcon />
    </IconButton>
  );
}

export function MuteButton() {
  const [muted, setMutedState] = useState(false);
  useEffect(() => setMutedState(isMuted()), []);
  const toggle = () => {
    setMuted(!muted);
    setMutedState(!muted);
  };
  return (
    <IconButton label={muted ? "Ativar som" : "Silenciar"} onClick={toggle}>
      <Icon>
        <path d="M11 5 6 9H3v6h3l5 4V5Z" />
        {muted ? (
          <>
            <path d="m22 9-6 6" />
            <path d="m16 9 6 6" />
          </>
        ) : (
          <>
            <path d="M15.5 8.5a5 5 0 0 1 0 7" />
            <path d="M19 5a10 10 0 0 1 0 14" />
          </>
        )}
      </Icon>
    </IconButton>
  );
}

/** Dicas no hover: vêm ligadas e ficam salvas no aparelho. */
export function useTips(): [boolean, () => void] {
  const [on, setOn] = useState(true);
  useEffect(() => {
    try {
      setOn(localStorage.getItem("truco.tips") !== "0");
    } catch {}
  }, []);
  const toggle = () =>
    setOn((v) => {
      try {
        localStorage.setItem("truco.tips", v ? "0" : "1");
      } catch {}
      return !v;
    });
  return [on, toggle];
}

/** Liga/desliga as dicas no hover (oculto em telas de toque, onde não há hover). */
export function TipsButton({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <IconButton
      label={on ? "Dicas das cartas: ligadas" : "Dicas das cartas: desligadas"}
      onClick={onClick}
      active={on}
      className={`[@media(hover:none)]:hidden ${on ? "" : "!text-white/50"}`}
    >
      <Icon className="h-5 w-5">
        <path d="M9 18h6" />
        <path d="M10 22h4" />
        <path d="M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.3 1 2.1V17h6v-.2c0-.8.4-1.6 1-2.1A7 7 0 0 0 12 2Z" />
      </Icon>
    </IconButton>
  );
}
