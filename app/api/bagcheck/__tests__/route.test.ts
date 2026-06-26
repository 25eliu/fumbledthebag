import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/tako", () => ({ takoSearch: vi.fn(), fetchCardSeries: vi.fn() }));
vi.mock("@/lib/cache", () => ({
  bagKey: (t: string, y: number, m: number) => `bag:${t}:${y}:${m}`,
  cacheGet: vi.fn().mockResolvedValue(null),
  cacheSet: vi.fn().mockResolvedValue(undefined),
}));

import { POST } from "@/app/api/bagcheck/route";
import { takoSearch, fetchCardSeries } from "@/lib/tako";

function req(body: unknown) {
  return new Request("http://test/api/bagcheck", { method: "POST", body: JSON.stringify(body) });
}

const goodCard = {
  card_id: "c", title: "NVDA", description: "", webpage_url: "https://trytako.com/c/nvda",
  image_url: "https://trytako.com/img", embed_url: "https://trytako.com/embed",
  confidence: "High",
};

const goodSeries = [
  { x: "2020-01-02 00:00:00+00:00", y: 5 },
  { x: "2024-01-02 00:00:00+00:00", y: 100 },
];

beforeEach(() => vi.clearAllMocks());

describe("POST /api/bagcheck", () => {
  it("returns a computed BagResult on the happy path", async () => {
    (takoSearch as any).mockResolvedValue(goodCard);
    (fetchCardSeries as any).mockResolvedValue(goodSeries);
    const res = await POST(req({ ticker: "NVDA", year: 2020, month: 1, amount: 1000 }));
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.ticker).toBe("NVDA");
    expect(json.multiple).toBe(20);
    expect(json.embedUrl).toBe("https://trytako.com/embed");
  });

  it("returns 400 on malformed input", async () => {
    const res = await POST(req({ ticker: "", year: 1900, month: 99, amount: -5 }));
    expect(res.status).toBe(400);
  });

  it("retries with a looser query then returns NO_DATA when no card found", async () => {
    (takoSearch as any).mockResolvedValue(null);
    (fetchCardSeries as any).mockResolvedValue([]);
    const res = await POST(req({ ticker: "ZZZZ", year: 2020, month: 1, amount: 1000 }));
    const json = await res.json();
    expect(json.error).toBe("NO_DATA");
    // Three takoSearch calls: primary + two looser retries (all return null)
    expect((takoSearch as any).mock.calls.length).toBe(3);
  });

  it("returns NO_DATA when card is found but series is empty", async () => {
    (takoSearch as any).mockResolvedValue(goodCard);
    (fetchCardSeries as any).mockResolvedValue([]);
    const res = await POST(req({ ticker: "NVDA", year: 2020, month: 1, amount: 1000 }));
    const json = await res.json();
    expect(json.error).toBe("NO_DATA");
    // Only one takoSearch call (card was found, no retry needed)
    expect((takoSearch as any).mock.calls.length).toBe(1);
    expect((fetchCardSeries as any).mock.calls.length).toBe(1);
  });
});
