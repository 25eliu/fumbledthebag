import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SentenceForm from "@/components/SentenceForm";

beforeEach(() => {
  // TickerBlank may fetch a preview card on hover/highlight; stub it out.
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ json: async () => ({ found: false, symbol: "X" }) }));
});
afterEach(() => vi.restoreAllMocks());

describe("SentenceForm", () => {
  it("submits the parsed sentence values", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<SentenceForm onSubmit={onSubmit} initial={{ ticker: "NVDA", amount: 10000 }} />);

    await user.clear(screen.getByLabelText(/when/i));
    await user.type(screen.getByLabelText(/when/i), "Mar 2020");
    await user.click(screen.getByRole("button", { name: /see the damage/i }));

    expect(onSubmit).toHaveBeenCalledWith({ ticker: "NVDA", month: 3, year: 2020, amount: 10000 });
  });

  it("shows an inline error for an unparseable date", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<SentenceForm onSubmit={onSubmit} initial={{ ticker: "NVDA", amount: 10000 }} />);

    await user.clear(screen.getByLabelText(/when/i));
    await user.type(screen.getByLabelText(/when/i), "banana");
    await user.click(screen.getByRole("button", { name: /see the damage/i }));

    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByText(/read that date|enter a date/i)).toBeInTheDocument();
  });

  it("resolves the company name caption from a known ticker", () => {
    render(<SentenceForm onSubmit={vi.fn()} initial={{ ticker: "NVDA", amount: 10000 }} />);
    expect(screen.getByText(/NVIDIA/i)).toBeInTheDocument();
  });

  it("requires a ticker before submitting", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<SentenceForm onSubmit={onSubmit} initial={{ amount: 10000 }} />);
    await user.clear(screen.getByLabelText(/when/i));
    await user.type(screen.getByLabelText(/when/i), "Mar 2020");
    await user.click(screen.getByRole("button", { name: /see the damage/i }));
    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByText(/name a ticker/i)).toBeInTheDocument();
  });
});
