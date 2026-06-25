import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import BagForm from "@/components/BagForm";

describe("BagForm", () => {
  it("submits parsed values", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<BagForm onSubmit={onSubmit} initial={{ ticker: "NVDA", amount: 10000 }} />);

    await user.clear(screen.getByLabelText(/when/i));
    await user.type(screen.getByLabelText(/when/i), "Mar 2020");
    await user.click(screen.getByRole("button", { name: /check my bag/i }));

    expect(onSubmit).toHaveBeenCalledWith({ ticker: "NVDA", month: 3, year: 2020, amount: 10000 });
  });

  it("shows an inline error for an unparseable date", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<BagForm onSubmit={onSubmit} initial={{ ticker: "NVDA", amount: 10000 }} />);
    await user.clear(screen.getByLabelText(/when/i));
    await user.type(screen.getByLabelText(/when/i), "banana");
    await user.click(screen.getByRole("button", { name: /check my bag/i }));
    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByText(/couldn't read that date|enter a date/i)).toBeInTheDocument();
  });

  it("fills the ticker from a preset chip", async () => {
    const user = userEvent.setup();
    render(<BagForm onSubmit={vi.fn()} />);
    await user.click(screen.getByRole("button", { name: "TSLA" }));
    expect(screen.getByLabelText(/ticker/i)).toHaveValue("TSLA");
  });
});
