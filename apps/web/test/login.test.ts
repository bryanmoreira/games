import { describe, expect, test } from "bun:test";
import { LOGIN_PATH, loginHref, safeNext } from "@/lib/login";

describe("voltar depois do login", () => {
  test("caminhos internos passam", () => {
    expect(safeNext("/")).toBe("/");
    expect(safeNext("/sudoku")).toBe("/sudoku");
    expect(safeNext("/perfil/ana?aba=amigos#topo")).toBe("/perfil/ana?aba=amigos#topo");
  });

  test("outro site: volta para o início", () => {
    expect(safeNext("//site.com")).toBe("/");
    expect(safeNext("//site.com/login")).toBe("/");
    expect(safeNext("https://site.com")).toBe("/");
    expect(safeNext("http://localhost/sudoku")).toBe("/");
    expect(safeNext("javascript:alert(1)")).toBe("/");
    expect(safeNext("sudoku")).toBe("/");
  });

  test("vazio: volta para o início", () => {
    expect(safeNext(null)).toBe("/");
    expect(safeNext(undefined)).toBe("/");
    expect(safeNext("")).toBe("/");
  });

  test("a própria tela de login não vira destino (sem loop)", () => {
    expect(safeNext(LOGIN_PATH)).toBe("/");
    expect(safeNext("/login?next=/sudoku")).toBe("/");
    expect(safeNext("/login/qualquer")).toBe("/");
  });

  // comportamento atual: o prefixo "/login" também pega rotas que só começam igual
  test("rotas que começam com /login também são recusadas", () => {
    expect(safeNext("/loginho")).toBe("/");
  });
});

describe("link para o login", () => {
  test("sem next quando é o início", () => {
    expect(loginHref("/")).toBe("/login");
  });

  test("destino inválido: sem next", () => {
    expect(loginHref("//site.com")).toBe("/login");
    expect(loginHref("/login")).toBe("/login");
  });

  test("next codificado", () => {
    expect(loginHref("/sudoku")).toBe("/login?next=%2Fsudoku");
    expect(loginHref("/perfil/ana?aba=amigos&x=1")).toBe("/login?next=%2Fperfil%2Fana%3Faba%3Damigos%26x%3D1");
  });

  test("o next volta igual depois de decodificado", () => {
    const next = "/perfil/joão?aba=amigos";
    const href = loginHref(next);
    expect(safeNext(new URL(href, "http://x").searchParams.get("next"))).toBe(next);
  });
});
