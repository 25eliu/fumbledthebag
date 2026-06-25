import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import BagApp from "@/components/BagApp";
import type { BagResult } from "@/lib/types";

const result: BagResult = {
  ticker: "NVDA", year: 2020, month: 3, amount: 10000,
  startPrice: 5.97, startDateActual: "2020-03", currentPrice: 140, currentDate: "2026-06",
  multiple: 23.4, currentValue: 234100, gain: 224100, returnPct: 2241, snapped: false, isLoss: false,
  embedUrl: "https://embed", imageUrl: "https://img", confidence: "High",
};

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => result }));
});
afterEach(() => vi.restoreAllMocks());

describe("BagApp", () => {
  it("submits, shows the card, and rewrites the URL", async () => {
    const user = userEvent.setup();
    const replaceState = vi.spyOn(window.history, "replaceState");
    render(<BagApp initial={{ ticker: "NVDA", amount: 10000 }} />);

    await user.clear(screen.getByLabelText(/when/i));
    await user.type(screen.getByLabelText(/when/i), "Mar 2020");
    await user.click(screen.getByRole("button", { name: /see the damage/i }));

    expect(await screen.findByText("$234,100")).toBeInTheDocument();
    expect(replaceState).toHaveBeenCalledWith(null, "", "/c/NVDA/2020/3/10000");
  });

  it("renders an IPO_AFTER error inline", async () => {
    (fetch as any).mockResolvedValue({ ok: true, json: async () => ({ error: "IPO_AFTER", message: "Earliest data is 2020-01.", suggestedYear: 2020, suggestedMonth: 1 }) });
    const user = userEvent.setup();
    render(<BagApp initial={{ ticker: "NVDA", amount: 10000 }} />);
    await user.clear(screen.getByLabelText(/when/i));
    await user.type(screen.getByLabelText(/when/i), "Jan 2010");
    await user.click(screen.getByRole("button", { name: /see the damage/i }));
    expect(await screen.findByText(/Earliest data is 2020-01/)).toBeInTheDocument();
  });

  it("renders an initialResult immediately (for /c/ pages)", () => {
    render(<BagApp initialResult={result} initial={{ ticker: "NVDA", month: 3, year: 2020, amount: 10000 }} />);
    expect(screen.getByText("$234,100")).toBeInTheDocument();
  });
});
