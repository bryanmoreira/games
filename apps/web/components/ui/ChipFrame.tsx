/** Borda de ficha de pôquer (vermelha com listras brancas) para pôr atrás de uma foto redonda. Ocupa o pai inteiro (absolute). */
export function ChipFrame({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true" className={`absolute inset-0 h-full w-full ${className}`}>
      <circle cx="32" cy="32" r="32" fill="#b8322a" />
      <circle cx="32" cy="32" r="27.5" fill="none" stroke="#f5efe2" strokeWidth="9" strokeDasharray="10.8 10.8" />
      <circle cx="32" cy="32" r="22.5" fill="none" stroke="rgba(0,0,0,0.45)" strokeWidth="2" />
    </svg>
  );
}

/** Foto (ou inicial) dentro da ficha: o miolo ocupa 70%, o resto é a borda. */
export function ChipAvatar({ user, className = "", frameClassName = "" }: { user: { name: string; image?: string | null }; className?: string; frameClassName?: string }) {
  return (
    <span className={`relative flex shrink-0 items-center justify-center rounded-full drop-shadow-[0_4px_6px_rgba(0,0,0,0.5)] ${className}`}>
      <ChipFrame className={frameClassName} />
      <span className="relative flex h-[70%] w-[70%] items-center justify-center overflow-hidden rounded-full bg-[#3b2a10] font-display text-gold">
        {user.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={user.image} alt="" referrerPolicy="no-referrer" className="h-full w-full object-cover" />
        ) : (
          user.name.charAt(0).toUpperCase()
        )}
      </span>
    </span>
  );
}
