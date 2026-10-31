import { describe, expect, test } from "bun:test";
import { dailyMessage, isSubscription } from "@/lib/push";
import { inviteTitle, seoSlug } from "@/lib/room-preview";
import { widgetCode, WIDGET_GAMES } from "@/lib/widget";

const keys = { p256dh: "BNc...", auth: "abc" };

describe("lembrete do desafio (push)", () => {
  test("só aceita os serviços de push dos navegadores", () => {
    expect(isSubscription({ endpoint: "https://fcm.googleapis.com/fcm/send/xyz", keys })).toBe(true);
    expect(isSubscription({ endpoint: "https://updates.push.services.mozilla.com/wpush/v2/x", keys })).toBe(true);
    expect(isSubscription({ endpoint: "https://web.push.apple.com/QW", keys })).toBe(true);
    expect(isSubscription({ endpoint: "https://wns2-bl2p.notify.windows.com/w/?token=1", keys })).toBe(true);
    expect(isSubscription({ endpoint: "https://evil.example.com/hook", keys })).toBe(false);
    expect(isSubscription({ endpoint: "http://fcm.googleapis.com/x", keys })).toBe(false);
    expect(isSubscription({ endpoint: "https://fcm.googleapis.com.evil.com/x", keys })).toBe(false);
    expect(isSubscription({ endpoint: "https://fcm.googleapis.com/x" })).toBe(false);
  });

  test("texto do lembrete: um só para todos os desafios", () => {
    const msg = dailyMessage("2026-10-31");
    expect(msg.body).toBe("Os desafios diários estão prontos.");
    expect(msg.url).toBe("/");
  });
});

describe("convite da sala", () => {
  test("título com quem chamou, ou só o jogo quando a sala acabou", () => {
    expect(inviteTitle("truco-paulista", { game: "truco-paulista", host: "Bryan", humans: 1, seats: 4, started: false })).toBe("Bryan te chamou para jogar Truco Paulista");
    expect(inviteTitle("truco-paulista", null)).toBe("Convite para jogar Truco Paulista");
    expect(seoSlug("connect4")).toBe("connect-4");
  });
});

describe("widget", () => {
  test("o código tem iframe e um link de texto para o site", () => {
    for (const g of WIDGET_GAMES) {
      const code = widgetCode(g);
      expect(code).toContain(`<iframe src="https://mesadejogos.com/embed/${g}"`);
      expect(code).toMatch(/<a href="https:\/\/mesadejogos\.com\/[^"]+\/diario">/);
    }
  });
});
