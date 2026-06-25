import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import BagApp from "@/components/BagApp";

const success = {
  ticker: "NVDA", year: 2020, month: 1, amount: 10000,
  startPrice: 5, startDateActual: "2020-01", currentPrice: 100, currentDate: "2026-06",
  multiple: 20, currentValue: 200000, gain: 190000, returnPct: 1900, snapped: false, isLoss: false,
  embedUrl: "e", imageUrl: "i",
};

beforeEach(() => {
  (globalThis as any).__calls = 0;
  vi.stubGlobal("fetch", vi.fn().mockImplementation(async () => {
    (globalThis as any).__calls += 1;
    if ((globalThis as any).__calls === 1) {
      return { ok: true, json: async () => ({ error: "IPO_AFTER", message: "Earliest data is 2020-01.", suggestedYear: 2020, suggestedMonth: 1 }) };
    }
    return { ok: true, json: async () => success };
  }));
});
afterEach(() => vi.restoreAllMocks());

describe("BagApp IPO_AFTER one-tap fix", () => {
  it("re-submits with the suggested month and shows the result", async () => {
    const user = userEvent.setup();
    render(<BagApp initial={{ ticker: "NVDA", amount: 10000 }} />);
    await user.clear(screen.getByLabelText(/when/i));
    await user.type(screen.getByLabelText(/when/i), "Jan 2010");
    await user.click(screen.getByRole("button", { name: /see the damage/i }));

    const fix = await screen.findByRole("button", { name: /try jan 2020/i });
    await user.click(fix);
    expect(await screen.findByText("$200,000")).toBeInTheDocument();
  });
});
