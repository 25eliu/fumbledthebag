import { describe, it, expect, vi, afterEach } from "vitest";
import { takoSearch } from "@/lib/tako";

afterEach(() => vi.restoreAllMocks());

describe("takoSearch", () => {
  it("sends light theme and returns the first card", async () => {
    const card = { card_id: "x", title: "NVDA", embed_url: "e", image_url: "i", webpage_url: "w", description: "d" };
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ outputs: { knowledge_cards: [card] } }),
    });
    vi.stubGlobal("fetch", fetchMock);
    vi.stubEnv("TAKO_API_KEY", "test-key");

    const result = await takoSearch("NVDA stock");
    expect(result).toEqual(card);

    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.output_settings.knowledge_card_settings.image_dark_mode).toBe(false);
    expect(fetchMock.mock.calls[0][1].headers["X-API-Key"]).toBe("test-key");
  });

  it("returns null when there are no cards", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ outputs: { knowledge_cards: [] } }) }));
    expect(await takoSearch("nothing")).toBeNull();
  });

  it("throws on a non-OK response", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 500, text: async () => "boom" }));
    await expect(takoSearch("err")).rejects.toThrow(/Tako 500/);
  });
});
