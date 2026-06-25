import { describe, it, expect } from "vitest";
import { DURATION, EASE, SPRING, cardReveal, rowItem, popover } from "@/lib/motion";

describe("motion system", () => {
  it("exposes consistent timing tokens", () => {
    expect(typeof DURATION.base).toBe("number");
    expect(Array.isArray(EASE)).toBe(true);
    expect(SPRING.type).toBe("spring");
  });
  it("defines hidden/show states for shared variants", () => {
    for (const v of [cardReveal, rowItem, popover]) {
      expect(v).toHaveProperty("hidden");
      expect(v).toHaveProperty("show");
    }
  });
});
