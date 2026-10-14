"use client";

import { LEVELS, type Level, type Settings } from "@truco/damas";
import type { RoomInfo } from "@truco/game";
import { send } from "@/lib/socket";
import { Row, Segmented } from "@/components/ui/Options";
import { BotIcon } from "@/components/ui/icons";

export const LEVEL_LABEL: Record<Level, string> = { easy: "FÁCIL", medium: "MÉDIO", hard: "DIFÍCIL" };

/** Nível da IA: na página do jogo (solo) e no lobby (só o host muda). */
export function DamasOptions({ value, onChange, disabled = false }: { value: Settings; onChange: (s: Settings) => void; disabled?: boolean }) {
  return (
    <div className="flex w-full flex-col gap-4 rounded-2xl bg-white/5 p-3 ring-1 ring-white/10 sm:p-4">
      <Row icon={<BotIcon className="h-4 w-4" />} label="IA">
        <Segmented
          options={LEVELS}
          value={value.level}
          disabled={disabled}
          onPick={(level) => onChange({ ...value, level })}
          render={(lv) => <span className="text-xs sm:text-sm">{LEVEL_LABEL[lv]}</span>}
        />
      </Row>
    </div>
  );
}

/** Opções no lobby da sala: só aparecem com IA na mesa. */
export function DamasSettings({ room }: { room: RoomInfo }) {
  if (!room.seats.some((seat) => seat.kind === "bot")) return null;
  return <DamasOptions value={room.settings as Settings} disabled={!room.isHost} onChange={(settings) => send({ t: "settings", settings })} />;
}
