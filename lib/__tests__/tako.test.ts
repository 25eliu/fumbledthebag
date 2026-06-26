import { describe, it, expect, vi, afterEach } from "vitest";
import { takoSearch, fetchCardSeries } from "@/lib/tako";

afterEach(() => vi.restoreAllMocks());

describe("takoSearch", () => {
  it("sends light theme and returns the matching chart card", async () => {
    const card = { card_id: "x", title: "NVDA Closing Price", card_type: "chart", embed_url: "e", image_url: "i", webpage_url: "w", description: "d" };
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ outputs: { knowledge_cards: [card] } }),
    });
    vi.stubGlobal("fetch", fetchMock);
    vi.stubEnv("TAKO_API_KEY", "test-key");

    const result = await takoSearch("NVDA stock", "NVDA");
    expect(result).toEqual(card);

    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.output_settings.knowledge_card_settings.image_dark_mode).toBe(false);
    expect(fetchMock.mock.calls[0][1].headers["X-API-Key"]).toBe("test-key");
  });

  it("rejects a non-chart card and a wrong-entity match (SPY → SpyCloud)", async () => {
    const wrong = { card_id: "s", title: "SpyCloud, Inc. Funding", card_type: "card", embed_url: "e", image_url: "i", webpage_url: "w", description: "d" };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ outputs: { knowledge_cards: [wrong] } }) }));
    vi.stubEnv("TAKO_API_KEY", "test-key");
    expect(await takoSearch("SPY stock price", "SPY")).toBeNull();
  });

  it("picks the matching chart from among several candidates", async () => {
    const cards = [
      { card_id: "a", title: "Some Overview", card_type: "card", embed_url: "", image_url: "", webpage_url: "", description: "" },
      { card_id: "b", title: "AAPL Closing Price", card_type: "chart", embed_url: "e", image_url: "i", webpage_url: "w", description: "" },
    ];
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ outputs: { knowledge_cards: cards } }) }));
    vi.stubEnv("TAKO_API_KEY", "test-key");
    const result = await takoSearch("AAPL stock", "AAPL");
    expect(result?.card_id).toBe("b");
  });

  it("matches a descriptive term as a substring (S&P 500 benchmark)", async () => {
    const card = { card_id: "spx", title: "SPDR S&P 500 ETF Trust Closing Price", card_type: "chart", embed_url: "e", image_url: "i", webpage_url: "w", description: "d" };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ outputs: { knowledge_cards: [card] } }) }));
    vi.stubEnv("TAKO_API_KEY", "test-key");
    expect(await takoSearch("S&P 500 since 2020", "S&P 500")).toEqual(card);
  });

  it("maps relevance to confidence when confidence is absent", async () => {
    const card = { card_id: "x", title: "NVDA Closing Price", card_type: "chart", relevance: "High", embed_url: "e", image_url: "i", webpage_url: "w", description: "d" };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ outputs: { knowledge_cards: [card] } }) }));
    vi.stubEnv("TAKO_API_KEY", "test-key");
    const result = await takoSearch("NVDA stock", "NVDA");
    expect(result?.confidence).toBe("High");
  });

  it("returns null when there are no cards", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ outputs: { knowledge_cards: [] } }) }));
    expect(await takoSearch("nothing", "NVDA")).toBeNull();
  });

  it("throws on a non-OK response", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 500, statusText: "Error", text: async () => "boom" }));
    await expect(takoSearch("err", "NVDA")).rejects.toThrow(/Tako 500/);
  });
});

describe("fetchCardSeries", () => {
  it("fetches inline contents in one call and returns parsed TakoPoints", async () => {
    const csvBody = "Timestamp,closing_price - NVDA Closing Price\n2020-01-02 00:00:00+00:00,5.99\n2020-02-03 00:00:00+00:00,6.5\n";
    const fetchMock = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ contents: [{ format: "csv", data: csvBody, total_rows: 2, truncated: false }] }),
    });
    vi.stubGlobal("fetch", fetchMock);
    vi.stubEnv("TAKO_API_KEY", "test-key");

    const result = await fetchCardSeries("https://trytako.com/c/abc");
    expect(result).toEqual([
      { x: "2020-01-02 00:00:00+00:00", y: 5.99 },
      { x: "2020-02-03 00:00:00+00:00", y: 6.5 },
    ]);
    // Exactly one call: the inline /contents POST (no second S3 GET)
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toBe("https://trytako.com/api/v1/contents");
    expect(fetchMock.mock.calls[0][1].method).toBe("POST");
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toMatchObject({ mode: "inline" });
  });

  it("returns [] when inline contents has no data", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ contents: [{ format: "csv" }] }),
    }));
    vi.stubEnv("TAKO_API_KEY", "test-key");
    const result = await fetchCardSeries("https://trytako.com/c/missing");
    expect(result).toEqual([]);
  });

  it("skips non-numeric rows and the header", async () => {
    const csvBody = "Timestamp,closing_price\n2020-01-02 00:00:00+00:00,10\nbad-row,notanumber\n2020-03-02 00:00:00+00:00,20\n";
    vi.stubGlobal("fetch", vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ contents: [{ format: "csv", data: csvBody }] }),
    }));
    vi.stubEnv("TAKO_API_KEY", "test-key");
    const result = await fetchCardSeries("https://trytako.com/c/abc");
    expect(result).toEqual([
      { x: "2020-01-02 00:00:00+00:00", y: 10 },
      { x: "2020-03-02 00:00:00+00:00", y: 20 },
    ]);
  });

  it("reads the value from the last column by header position", async () => {
    // A 3-column card: the metric is the LAST column, not the rightmost comma's neighbor by accident.
    const csvBody = "Timestamp,volume,closing_price\n2020-01-02 00:00:00+00:00,1000,42.5\n";
    vi.stubGlobal("fetch", vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ contents: [{ format: "csv", data: csvBody }] }),
    }));
    vi.stubEnv("TAKO_API_KEY", "test-key");
    const result = await fetchCardSeries("https://trytako.com/c/abc");
    expect(result).toEqual([{ x: "2020-01-02 00:00:00+00:00", y: 42.5 }]);
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
