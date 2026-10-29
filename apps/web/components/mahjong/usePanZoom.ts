"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const MAX_ZOOM = 3;
/** Arrasto maior que isso não é toque na peça. */
const DRAG_PX = 8;

interface View {
  z: number;
  x: number;
  y: number;
}

/**
 * Zoom com pinça (ou roda do mouse) e, ampliado, arrastar com um dedo ou com o mouse.
 * `view` e `board` em px. Ampliado, dá para levar qualquer borda da mesa até o meio da tela.
 * Depois de um arrasto, o clique seguinte é engolido (`onClickCapture`) para não tirar peça sem querer.
 */
export function usePanZoom(view: { w: number; h: number } | null, board: { w: number; h: number } | null) {
  const [v, setV] = useState<View>({ z: 1, x: 0, y: 0 });
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const start = useRef<{ v: View; mid: { x: number; y: number }; dist: number } | null>(null);
  const dragged = useRef(false);
  const el = useRef<HTMLElement | null>(null);

  const clamp = useCallback(
    (n: View): View => {
      if (!view || !board) return n;
      const z = Math.min(MAX_ZOOM, Math.max(1, n.z));
      // sem zoom a mesa fica parada no centro; ampliada, a borda pode chegar até o meio da tela
      const mx = z > 1 ? Math.max((board.w * z) / 2, (board.w * z - view.w) / 2) : 0;
      const my = z > 1 ? Math.max((board.h * z) / 2, (board.h * z - view.h) / 2) : 0;
      return { z, x: Math.min(mx, Math.max(-mx, n.x)), y: Math.min(my, Math.max(-my, n.y)) };
    },
    [view, board],
  );

  // mudou o tamanho da tela ou o formato: volta a caber inteiro
  useEffect(() => setV({ z: 1, x: 0, y: 0 }), [view?.w, view?.h, board?.w, board?.h]);

  /** Ponto relativo ao centro da área da mesa. */
  const local = (e: { clientX: number; clientY: number }) => {
    const r = el.current!.getBoundingClientRect();
    return { x: e.clientX - r.left - r.width / 2, y: e.clientY - r.top - r.height / 2 };
  };

  const begin = (cur: View) => {
    const ps = [...pointers.current.values()];
    if (ps.length === 1) start.current = { v: cur, mid: ps[0], dist: 0 };
    else if (ps.length >= 2) {
      const [a, b] = ps;
      start.current = { v: cur, mid: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }, dist: Math.hypot(a.x - b.x, a.y - b.y) };
    }
  };

  const onPointerDown = (e: React.PointerEvent<HTMLElement>) => {
    el.current = e.currentTarget;
    if (e.pointerType === "mouse" && e.button !== 0) return;
    pointers.current.set(e.pointerId, local(e));
    if (pointers.current.size === 1) dragged.current = false;
    begin(v);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLElement>) => {
    if (!pointers.current.has(e.pointerId) || !start.current) return;
    pointers.current.set(e.pointerId, local(e));
    const ps = [...pointers.current.values()];
    const s = start.current;
    if (ps.length >= 2) {
      const [a, b] = ps;
      const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
      const z = (s.v.z * Math.hypot(a.x - b.x, a.y - b.y)) / Math.max(1, s.dist);
      const k = z / s.v.z;
      dragged.current = true;
      // o ponto da mesa que estava entre os dedos continua entre os dedos
      setV(clamp({ z, x: mid.x - (s.mid.x - s.v.x) * k, y: mid.y - (s.mid.y - s.v.y) * k }));
    } else if (s.v.z > 1) {
      const dx = ps[0].x - s.mid.x;
      const dy = ps[0].y - s.mid.y;
      if (!dragged.current && Math.hypot(dx, dy) < DRAG_PX) return;
      dragged.current = true;
      setV(clamp({ z: s.v.z, x: s.v.x + dx, y: s.v.y + dy }));
    }
  };

  const onPointerUp = (e: React.PointerEvent<HTMLElement>) => {
    if (!pointers.current.delete(e.pointerId)) return;
    // tirou um dos dois dedos: o que ficou continua arrastando de onde está
    setV((cur) => {
      begin(cur);
      return cur;
    });
  };

  // roda do mouse amplia em volta do ponteiro (ouvinte nativo: o do React é passivo e não segura a rolagem)
  const [node, setNode] = useState<HTMLElement | null>(null);
  useEffect(() => {
    if (!node) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      el.current = node;
      const p = local(e);
      setV((cur) => {
        const z = Math.min(MAX_ZOOM, Math.max(1, cur.z * Math.exp(-e.deltaY * 0.0015)));
        const k = z / cur.z;
        return clamp({ z, x: p.x - (p.x - cur.x) * k, y: p.y - (p.y - cur.y) * k });
      });
    };
    node.addEventListener("wheel", onWheel, { passive: false });
    return () => node.removeEventListener("wheel", onWheel);
  }, [node, clamp]);

  const onClickCapture = (e: React.MouseEvent) => {
    if (!dragged.current) return;
    dragged.current = false;
    e.stopPropagation();
    e.preventDefault();
  };

  const reset = () => setV({ z: 1, x: 0, y: 0 });
  /** Amplia pelo centro (botão da lupa, para quem não sabe da pinça). */
  const zoomIn = () => setV((cur) => clamp({ z: 2, x: cur.x * (2 / cur.z), y: cur.y * (2 / cur.z) }));

  return {
    zoom: v.z,
    transform: `translate(${v.x}px, ${v.y}px) scale(${v.z})`,
    reset,
    zoomIn,
    /** ref da área da mesa (para a roda do mouse) */
    bind: setNode,
    handlers: { onPointerDown, onPointerMove, onPointerUp, onPointerCancel: onPointerUp, onPointerLeave: onPointerUp, onClickCapture },
  };
}
