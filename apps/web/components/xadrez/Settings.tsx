"use client";

import { CLOCKS, LEVELS, type Level, type Settings } from "@truco/xadrez";
import type { RoomInfo } from "@truco/game";
import { send } from "@/lib/socket";
import { Row, Segmented } from "@/components/ui/Options";
import { BotIcon, ClockIcon, InfinityIcon } from "@/components/ui/icons";

export const LEVEL_LABEL: Record<Level, string> = { easy: "FÁCIL", medium: "MÉDIO", hard: "DIFÍCIL" };

/** Nível da IA e relógio: na página do jogo e no lobby (só o host muda). */
export function XadrezOptions({
  value,
  onChange,
  disabled = false,
  level = true,
}: {
  value: Settings;
  onChange: (s: Settings) => void;
  disabled?: boolean;
  /** Mostra o nível da IA (no lobby, só com IA na mesa). */
  level?: boolean;
}) {
  return (
    <div className="flex w-full flex-col gap-4 rounded-2xl bg-white/5 p-3 ring-1 ring-white/10 sm:p-4">
      {level && (
        <Row icon={<BotIcon className="h-4 w-4" />} label="IA">
          <Segmented
            options={LEVELS}
            value={value.level}
            disabled={disabled}
            onPick={(lv) => onChange({ ...value, level: lv })}
            render={(lv) => <span className="text-xs sm:text-sm">{LEVEL_LABEL[lv]}</span>}
          />
        </Row>
      )}
      <Row icon={<ClockIcon className="h-4 w-4" />} label="RELÓGIO">
        <Segmented
          options={CLOCKS}
          value={value.clock}
          disabled={disabled}
          onPick={(clock) => onChange({ ...value, clock })}
          render={(c) => (c === "none" ? <InfinityIcon className="h-5 w-5" /> : <span className="text-xs sm:text-sm">{c}</span>)}
        />
      </Row>
    </div>
  );
}

/** Opções no lobby da sala. */
export function XadrezSettings({ room }: { room: RoomInfo }) {
  return (
    <XadrezOptions
      value={room.settings as Settings}
      level={room.seats.some((seat) => seat.kind === "bot")}
      disabled={!room.isHost}
      onChange={(settings) => send({ t: "settings", settings })}
    />
  );
}
