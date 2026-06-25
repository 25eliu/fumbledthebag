import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import TickerTakoCard from "@/components/TickerTakoCard";

describe("TickerTakoCard", () => {
  it("renders the ticker chip", () => {
    render(<TickerTakoCard ticker="NVDA" embedUrl="https://e" imageUrl="https://i" />);
    expect(screen.getByRole("button", { name: /NVDA/ })).toBeInTheDocument();
  });

  it("opens a modal with the embed iframe on click", async () => {
    const user = userEvent.setup();
    render(<TickerTakoCard ticker="NVDA" embedUrl="https://embed.test" imageUrl="https://i" />);
    await user.click(screen.getByRole("button", { name: /NVDA/ }));
    const dialog = await screen.findByRole("dialog");
    expect(dialog).toBeInTheDocument();
    const iframe = dialog.querySelector("iframe");
    expect(iframe?.getAttribute("src")).toBe("https://embed.test");
  });

  it("closes the modal on Escape", async () => {
    const user = userEvent.setup();
    render(<TickerTakoCard ticker="NVDA" embedUrl="https://embed.test" imageUrl="https://i" />);
    await user.click(screen.getByRole("button", { name: /NVDA/ }));
    await screen.findByRole("dialog");
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
