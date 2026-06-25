import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import BagCard from "@/components/BagCard";
import type { BagResult, PickedItem } from "@/lib/types";

const gain: BagResult = {
  ticker: "NVDA", year: 2020, month: 3, amount: 10000,
  startPrice: 5.97, startDateActual: "2020-03", currentPrice: 140, currentDate: "2026-06",
  multiple: 23.4, currentValue: 234100, gain: 224100, returnPct: 2241, snapped: false, isLoss: false,
  embedUrl: "e", imageUrl: "i", confidence: "High",
};
const items: PickedItem[] = [
  { icon: "🌯", name: "Chipotle burritos", price: 12, scale: "everyday", blurb: "Guac included.", qty: 1240 },
];

describe("BagCard", () => {
  it("renders the worth, multiple, and items", () => {
    render(<BagCard result={gain} items={items} animate={false} />);
    expect(screen.getByText("$234,100")).toBeInTheDocument();
    expect(screen.getByText("23.4×")).toBeInTheDocument();
    expect(screen.getByText(/1,240 Chipotle burritos/)).toBeInTheDocument();
    expect(screen.getByText(/Mar(ch)? 2020/)).toBeInTheDocument();
  });

  it("shows loss framing for a negative return", () => {
    const loss: BagResult = { ...gain, currentValue: 3100, gain: -6900, multiple: 0.31, returnPct: -69, isLoss: true };
    render(<BagCard result={loss} items={items} animate={false} />);
    expect(screen.getByText(/Good thing you didn't/i)).toBeInTheDocument();
    expect(screen.getByText("$3,100")).toBeInTheDocument();
  });

  it("renders the snapped fine-print", () => {
    render(<BagCard result={{ ...gain, snapped: true }} items={items} animate={false} />);
    expect(screen.getByText(/Closest data/i)).toBeInTheDocument();
  });
});
