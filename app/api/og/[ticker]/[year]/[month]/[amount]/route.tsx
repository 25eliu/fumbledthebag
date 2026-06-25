import { ImageResponse } from "@vercel/og";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { pickItems } from "@/lib/pick-items";
import { seedFor } from "@/lib/url";
import { formatMoney, formatMultiple, formatQty, monthName } from "@/lib/format";
import type { BagResult, BagError } from "@/lib/types";

export const runtime = "nodejs";

type Params = { ticker: string; year: string; month: string; amount: string };

function loadFont(file: string): ArrayBuffer {
  const buf = readFileSync(join(process.cwd(), "assets", file));
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer;
}

export async function GET(request: Request, { params }: { params: Params }) {
  const values = {
    ticker: decodeURIComponent(params.ticker).toUpperCase(),
    year: Number(params.year),
    month: Number(params.month),
    amount: Number(params.amount),
  };

  const origin = new URL(request.url).origin;
  const res = await fetch(`${origin}/api/bagcheck`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(values),
    cache: "no-store",
  });
  const data = (await res.json()) as BagResult | BagError;

  const semibold = loadFont("Fredoka-SemiBold.ttf");
  const bold = loadFont("Fredoka-Bold.ttf");
  const fonts = [
    { name: "Fredoka", data: semibold, weight: 600 as const, style: "normal" as const },
    { name: "Fredoka", data: bold, weight: 700 as const, style: "normal" as const },
  ];

  if ("error" in data) {
    return new ImageResponse(
      (
        <div style={{ display: "flex", width: "100%", height: "100%", background: "#FFFDF7", alignItems: "center", justifyContent: "center", fontFamily: "Fredoka", fontSize: 56, color: "#2B2A33" }}>
          fumbledthebag 🧢
        </div>
      ),
      { width: 1200, height: 630, fonts }
    );
  }

  const items = pickItems(Math.abs(data.gain), seedFor(values)).slice(0, 3);
  const [, sm] = data.startDateActual.split("-").map(Number);
  const accent = data.isLoss ? "#E5685C" : "#16B364";

  return new ImageResponse(
    (
      <div style={{ display: "flex", flexDirection: "column", width: "100%", height: "100%", background: "#FFFDF7", padding: 64, fontFamily: "Fredoka", color: "#2B2A33" }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 28, fontWeight: 600, color: "#9b9aa1" }}>
          <span>fumbledthebag</span><span>🧢</span>
        </div>
        <div style={{ display: "flex", fontSize: 34, marginTop: 24, fontWeight: 600 }}>
          {formatMoney(data.amount)} in {data.ticker} · {monthName(sm)} {data.year}
        </div>
        <div style={{ display: "flex", fontSize: 26, marginTop: 28, color: "#6f6e76" }}>
          {data.isLoss ? "🫠 Good thing you didn't — you'd have" : "it'd be worth"}
        </div>
        <div style={{ display: "flex", fontSize: 110, fontWeight: 700, color: accent, lineHeight: 1.05 }}>
          {formatMoney(data.currentValue)}
        </div>
        {!data.isLoss && (
          <div style={{ display: "flex", fontSize: 44, fontWeight: 700, color: accent }}>{formatMultiple(data.multiple)}</div>
        )}
        <div style={{ display: "flex", flexDirection: "column", marginTop: 28, gap: 10 }}>
          {items.map((item) => (
            <div key={item.name} style={{ display: "flex", fontSize: 30 }}>
              <span style={{ marginRight: 14 }}>{item.icon}</span>
              <span style={{ fontWeight: 600 }}>{formatQty(item.qty)} {item.name}</span>
            </div>
          ))}
        </div>
      </div>
    ),
    { width: 1200, height: 630, fonts }
  );
}
