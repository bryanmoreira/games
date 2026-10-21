"use client";

import { LEVELS, MODES, type Level, type Mode, type Settings } from "@mesa/jogo-da-velha";
import type { RoomInfo } from "@mesa/truco";
import { send } from "@/lib/socket";
import { Row, Segmented } from "@/components/ui/Options";
import { BotIcon } from "@/components/ui/icons";
import { FadeIcon, GridIcon } from "./icons";

export const MODE_LABEL: Record<Mode, string> = { classic: "CLÁSSICO", fading: "SOME" };
export const LEVEL_LABEL: Record<Level, string> = { easy: "FÁCIL", medium: "MÉDIO", hard: "IMPOSSÍVEL" };

/** Modo e nível da IA: na página do jogo (solo) e no lobby (só o host muda). */
export function VelhaOptions({
  value,
  onChange,
  disabled = false,
  level = true,
}: {
  value: Settings;
  onChange: (s: Settings) => void;
  disabled?: boolean;
  /** Mostra o nível da IA (no lobby, só quando há IA na mesa). */
  level?: boolean;
}) {
  return (
    <div className="flex w-full flex-col gap-4 rounded-2xl bg-white/5 p-3 ring-1 ring-white/10 sm:p-4">
      <Row icon={<GridIcon className="h-4 w-4" />} label="MODO">
        <Segmented
          options={MODES}
          value={value.mode}
          disabled={disabled}
          onPick={(mode) => onChange({ ...value, mode })}
          render={(m) => (
            <span className="flex items-center gap-1.5">
              {m === "fading" && <FadeIcon className="h-4 w-4" />}
              {MODE_LABEL[m]}
            </span>
          )}
        />
      </Row>
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
    </div>
  );
}

/** Opções no lobby da sala. */
export function VelhaSettings({ room }: { room: RoomInfo }) {
  const s = room.settings as Settings;
  return (
    <VelhaOptions
      value={s}
      disabled={!room.isHost}
      level={room.seats.some((seat) => seat.kind === "bot")}
      onChange={(settings) => send({ t: "settings", settings })}
    />
  );
}
