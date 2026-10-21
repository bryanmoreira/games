"use client";

import { useEffect, useRef, useState } from "react";
import { BOARD, MAX_WORDS_TEXT, parseWords, TIME_OPTIONS, type Settings } from "@mesa/codenames";
import type { RoomInfo } from "@mesa/truco";
import { send } from "@/lib/socket";
import { ClockIcon, ListIcon, TimeLabel } from "@/components/ui/icons";
import { Row, Segmented } from "@/components/ui/Options";

const DEBOUNCE = 400;

/** Opções da partida no lobby: lista de palavras (uma por linha) e tempo por fase. O host muda, os outros só veem. */
export function CodenamesSettings({ room }: { room: RoomInfo }) {
  const s = room.settings as Settings;
  const host = room.isHost;
  const [text, setText] = useState(s.words);
  const typing = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  // texto que veio do servidor (outra aba do host, ou quem não é host) entra quando não estou digitando
  useEffect(() => {
    if (!typing.current) setText(s.words);
  }, [s.words]);
  useEffect(() => () => clearTimeout(timer.current), []);

  const sendWords = (words: string) => {
    clearTimeout(timer.current);
    send({ t: "settings", settings: { ...s, words } });
  };

  const change = (words: string) => {
    setText(words);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => sendWords(words), DEBOUNCE);
  };

  const count = parseWords(text).length;
  const fill = Math.max(0, BOARD - count);

  return (
    <div className="flex w-full flex-col gap-4 rounded-2xl bg-white/5 p-3 ring-1 ring-white/10 sm:p-4">
      <Row icon={<ListIcon className="h-4 w-4" />} label="PALAVRAS" value={count}>
        <textarea
          value={text}
          readOnly={!host}
          maxLength={MAX_WORDS_TEXT}
          rows={5}
          spellCheck={false}
          onFocus={() => (typing.current = true)}
          onBlur={() => {
            typing.current = false;
            if (host && text !== s.words) sendWords(text);
          }}
          onChange={(e) => change(e.target.value)}
          placeholder={host ? "Uma palavra por linha" : ""}
          className={`w-full resize-y rounded-xl bg-black/30 px-3 py-2 text-sm font-semibold uppercase leading-relaxed outline-none ring-gold/60 placeholder:normal-case placeholder:font-normal placeholder:text-white/30 ${
            host ? "focus:ring-2" : "cursor-default text-white/70"
          }`}
        />
        {fill > 0 && (
          <span className="text-xs text-white/50">
            <span className="font-display text-gold">+{fill}</span> da lista pronta
          </span>
        )}
      </Row>

      <Row icon={<ClockIcon className="h-4 w-4" />} label="TEMPO">
        <Segmented
          options={TIME_OPTIONS}
          value={s.time}
          disabled={!host}
          onPick={(time) => send({ t: "settings", settings: { ...s, words: text, time } })}
          render={(t) => <TimeLabel seconds={t} className={t === 0 ? "h-5 w-5" : undefined} />}
        />
      </Row>
    </div>
  );
}
