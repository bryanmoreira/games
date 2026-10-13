import { describe, expect, test } from "bun:test";
import { msToMidnight } from "../src/midnight";

const at = (iso: string) => new Date(iso).getTime();
const H = 3600_000;

describe("agendador do desafio diário", () => {
  test.each([
    ["2026-10-12T00:00:00-03:00", 24 * H],
    ["2026-10-12T21:00:00-03:00", 3 * H],
    ["2026-10-12T23:59:55-03:00", 5_000],
    ["2026-10-13T02:30:00Z", 30 * 60_000],
  ])("de %s até a meia-noite de Brasília", (iso, ms) => {
    expect(msToMidnight(at(iso))).toBe(ms + 5_000);
  });

  test("dispara já no dia novo de Brasília", () => {
    const now = at("2026-10-12T15:00:00-03:00");
    const fire = new Date(now + msToMidnight(now));
    expect(new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(fire)).toBe("2026-10-13");
  });
});
