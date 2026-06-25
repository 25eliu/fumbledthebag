import { describe, it, expect, vi, afterEach } from "vitest";
import { takoSearch, fetchCardSeries } from "@/lib/tako";

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
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 500, statusText: "Error", text: async () => "boom" }));
    await expect(takoSearch("err")).rejects.toThrow(/Tako 500/);
  });
});

describe("fetchCardSeries", () => {
  it("fetches contents then CSV and returns parsed TakoPoints", async () => {
    const csvBody = "Timestamp,closing_price - NVDA Closing Price\n2020-01-02 00:00:00+00:00,5.99\n2020-02-03 00:00:00+00:00,6.5\n";
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ contents: [{ url: "https://s3/x.csv" }] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        text: async () => csvBody,
      });
    vi.stubGlobal("fetch", fetchMock);
    vi.stubEnv("TAKO_API_KEY", "test-key");

    const result = await fetchCardSeries("https://trytako.com/c/abc");
    expect(result).toEqual([
      { x: "2020-01-02 00:00:00+00:00", y: 5.99 },
      { x: "2020-02-03 00:00:00+00:00", y: 6.5 },
    ]);
    // First call: contents POST
    expect(fetchMock.mock.calls[0][0]).toBe("https://trytako.com/api/v1/contents");
    expect(fetchMock.mock.calls[0][1].method).toBe("POST");
    // Second call: S3 CSV GET (no auth header needed)
    expect(fetchMock.mock.calls[1][0]).toBe("https://s3/x.csv");
  });

  it("returns [] when contents response has no url", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ contents: [] }),
    }));
    vi.stubEnv("TAKO_API_KEY", "test-key");
    const result = await fetchCardSeries("https://trytako.com/c/missing");
    expect(result).toEqual([]);
  });

  it("skips non-numeric rows and the header", async () => {
    const csvBody = "Timestamp,closing_price\n2020-01-02 00:00:00+00:00,10\nbad-row,notanumber\n2020-03-02 00:00:00+00:00,20\n";
    vi.stubGlobal("fetch", vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ contents: [{ url: "https://s3/x.csv" }] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        text: async () => csvBody,
      }));
    vi.stubEnv("TAKO_API_KEY", "test-key");
    const result = await fetchCardSeries("https://trytako.com/c/abc");
    expect(result).toEqual([
      { x: "2020-01-02 00:00:00+00:00", y: 10 },
      { x: "2020-03-02 00:00:00+00:00", y: 20 },
    ]);
  });

  it("returns [] on non-OK contents response", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 500,
      text: async () => "server error",
    }));
    vi.stubEnv("TAKO_API_KEY", "test-key");
    const result = await fetchCardSeries("https://trytako.com/c/abc");
    expect(result).toEqual([]);
  });
});
