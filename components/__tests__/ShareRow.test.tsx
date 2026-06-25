import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ShareRow from "@/components/ShareRow";

describe("ShareRow", () => {
  const props = { ticker: "NVDA", resultUrl: "https://x.test/c/NVDA/2020/3/10000", ogImageUrl: "https://x.test/api/og/NVDA/2020/3/10000" };

  it("does not render a Share to X button", () => {
    render(<ShareRow {...props} />);
    expect(screen.queryByRole("link", { name: /share to x/i })).not.toBeInTheDocument();
  });

  it("copies the link to the clipboard", async () => {
    // user-event v14 installs its own navigator.clipboard stub during setup(),
    // so install the mock AFTER setup() with a configurable property so it wins,
    // then restore the original descriptor afterward.
    const user = userEvent.setup();
    const original = Object.getOwnPropertyDescriptor(navigator, "clipboard");
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
    try {
      render(<ShareRow {...props} />);
      await user.click(screen.getByRole("button", { name: /copy link/i }));
      expect(writeText).toHaveBeenCalledWith(props.resultUrl);
      expect(await screen.findByText(/copied/i)).toBeInTheDocument();
    } finally {
      if (original) Object.defineProperty(navigator, "clipboard", original);
    }
  });

  it("offers a download of the OG image", () => {
    render(<ShareRow {...props} />);
    const dl = screen.getByRole("link", { name: /download/i });
    expect(dl).toHaveAttribute("href", props.ogImageUrl);
    expect(dl).toHaveAttribute("download");
  });
});
