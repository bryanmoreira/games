import { describe, expect, test } from "bun:test";
import { normalizeUsername, USERNAME_MAX, USERNAME_MIN, usernameBase, usernameProblem } from "@/lib/username";

describe("normalizar", () => {
  test("tira espaços das pontas e põe em minúsculas", () => {
    expect(normalizeUsername("  Ana_Maria ")).toBe("ana_maria");
  });

  test("não mexe no meio", () => {
    expect(normalizeUsername("Ana Maria")).toBe("ana maria");
  });
});

describe("problemas do username", () => {
  test("válido", () => {
    expect(usernameProblem("ana_123")).toBeNull();
  });

  test(`curto: mínimo de ${USERNAME_MIN}`, () => {
    expect(usernameProblem("ab")).toBe("short");
    expect(usernameProblem("abc")).toBeNull();
    expect(usernameProblem("")).toBe("short");
  });

  test(`longo: máximo de ${USERNAME_MAX}`, () => {
    expect(usernameProblem("a".repeat(20))).toBeNull();
    expect(usernameProblem("a".repeat(21))).toBe("long");
  });

  test("espaços nas pontas não contam no tamanho", () => {
    expect(usernameProblem("  ab  ")).toBe("short");
    expect(usernameProblem(` ${"a".repeat(20)} `)).toBeNull();
  });

  test("maiúsculas viram minúsculas e passam", () => {
    expect(usernameProblem("AnaMaria")).toBeNull();
  });

  test("só letras sem acento, números e _", () => {
    expect(usernameProblem("ana maria")).toBe("chars");
    expect(usernameProblem("ana-maria")).toBe("chars");
    expect(usernameProblem("ana.maria")).toBe("chars");
    expect(usernameProblem("joão")).toBe("chars");
    expect(usernameProblem("___")).toBeNull();
  });

  test("tamanho é conferido antes dos caracteres", () => {
    expect(usernameProblem("a!")).toBe("short");
    expect(usernameProblem("!".repeat(21))).toBe("long");
  });

  test("nomes reservados, mesmo com maiúsculas", () => {
    for (const u of ["admin", "api", "login", "perfil", "jogador", "Conta", " AMIGOS "]) expect(usernameProblem(u)).toBe("reserved");
    expect(usernameProblem("admin2")).toBeNull();
  });
});

describe("base do username", () => {
  test("nome sem acentos, espaços e símbolos", () => {
    expect(usernameBase("João Silva", "x@y.com")).toBe("joaosilva");
    expect(usernameBase("Ângela Côrtes", "x@y.com")).toBe("angelacortes");
    expect(usernameBase("Otto Müller-Ñuñez", "x@y.com")).toBe("ottomullernunez");
    expect(usernameBase("Zé_Gotinha 99!", "x@y.com")).toBe("ze_gotinha99");
  });

  test("ç vira c", () => {
    expect(usernameBase("Conceição", "x@y.com")).toBe("conceicao");
  });

  test("nome curto ou só símbolos: usa o e-mail", () => {
    expect(usernameBase("Jo", "maria.souza@gmail.com")).toBe("mariasouza");
    expect(usernameBase("★★★", "Pedro_99@x.com")).toBe("pedro_99");
    expect(usernameBase("", "lucas@x.com")).toBe("lucas");
  });

  test("nome e e-mail curtos: jogador", () => {
    expect(usernameBase("Jo", "ab@x.com")).toBe("jogador");
    expect(usernameBase("", "")).toBe("jogador");
    expect(usernameBase("李小龙", "@x.com")).toBe("jogador");
  });

  test("corta para sobrar espaço para o número de desempate", () => {
    const base = usernameBase("Maria Eduarda Albuquerque Figueiredo", "x@y.com");
    expect(base).toBe("mariaeduardaalbu");
    expect(base.length).toBe(USERNAME_MAX - 4);
  });

  test("a base de 'jogador' é reservada sozinha", () => {
    expect(usernameProblem(usernameBase("", ""))).toBe("reserved");
  });
});
