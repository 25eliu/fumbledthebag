import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ShareRow from "@/components/ShareRow";

describe("ShareRow", () => {
  const props = { ticker: "NVDA", year: 2020, resultUrl: "https://x.test/c/NVDA/2020/3/10000", ogImageUrl: "https://x.test/api/og/NVDA/2020/3/10000" };

  it("links Share to X with the result url", () => {
    render(<ShareRow {...props} />);
    const link = screen.getByRole("link", { name: /share to x/i });
    expect(link).toHaveAttribute("href", expect.stringContaining("twitter.com/intent/tweet"));
    expect(decodeURIComponent(link.getAttribute("href")!)).toContain(props.resultUrl);
  });

  it("copies the link to the clipboard", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });
    const user = userEvent.setup();
    render(<ShareRow {...props} />);
    await user.click(screen.getByRole("button", { name: /copy link/i }));
    expect(writeText).toHaveBeenCalledWith(props.resultUrl);
    expect(await screen.findByText(/copied/i)).toBeInTheDocument();
  });

  it("offers a download of the OG image", () => {
    render(<ShareRow {...props} />);
    const dl = screen.getByRole("link", { name: /download/i });
    expect(dl).toHaveAttribute("href", props.ogImageUrl);
    expect(dl).toHaveAttribute("download");
  });
});
