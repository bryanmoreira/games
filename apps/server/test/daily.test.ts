import { describe, expect, test } from "bun:test";
import { msToHour, msToMidnight } from "../src/midnight";

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

describe("msToHour", () => {
  const at = (iso: string) => Date.parse(iso);
  test("antes da hora: falta o pedaço do dia", () => {
    // 9h de Brasília = 12h UTC; 10h fica a 1 hora
    expect(msToHour(10, at("2026-10-31T12:00:00Z"))).toBe(60 * 60_000);
  });
  test("depois da hora: amanhã", () => {
    // 11h de Brasília = 14h UTC; próximas 10h em 23 horas
    expect(msToHour(10, at("2026-10-31T14:00:00Z"))).toBe(23 * 60 * 60_000);
  });
  test("na hora exata: amanhã", () => {
    expect(msToHour(10, at("2026-10-31T13:00:00Z"))).toBe(24 * 60 * 60_000);
  });
});
