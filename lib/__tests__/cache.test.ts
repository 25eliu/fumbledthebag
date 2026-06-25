import { describe, it, expect, vi, beforeEach } from "vitest";

describe("cache", () => {
  beforeEach(() => { vi.resetModules(); });

  it("builds an uppercase bag key", async () => {
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "");
    const { bagKey } = await import("@/lib/cache");
    expect(bagKey("nvda", 2020, 3)).toBe("bag:NVDA:2020:3");
  });

  it("no-ops without Redis env (get returns null, set resolves)", async () => {
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "");
    const { cacheGet, cacheSet } = await import("@/lib/cache");
    await expect(cacheSet("k", { a: 1 })).resolves.toBeUndefined();
    await expect(cacheGet("k")).resolves.toBeNull();
  });
});
