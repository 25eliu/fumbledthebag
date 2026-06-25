import type { TakoCard, TakoPoint } from "@/lib/types";

export async function takoSearch(text: string): Promise<TakoCard | null> {
  const key = process.env.TAKO_API_KEY;
  console.log(`[tako] → query: ${JSON.stringify(text)} | API key present: ${!!key}${key ? ` (len ${key.length})` : " — MISSING!"}`);

  const res = await fetch("https://trytako.com/api/v1/knowledge_search", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-API-Key": key! },
    body: JSON.stringify({
      inputs: { text },
      source_indexes: ["tako"],
      search_effort: "fast",
      output_settings: { knowledge_card_settings: { image_dark_mode: false } },
      country_code: "US",
      locale: "en-US",
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    console.error(`[tako] ✗ HTTP ${res.status} ${res.statusText} — ${body.slice(0, 500)}`);
    throw new Error(`Tako ${res.status}: ${body}`);
  }

  const json = await res.json();
  const cards = json?.outputs?.knowledge_cards ?? [];
  const card = cards[0] ?? null;
  const points = card?.visualization_data?.data?.length ?? 0;
  console.log(
    `[tako] ← cards: ${cards.length} | card[0]: ${card ? `"${card.title}" (confidence ${card.confidence ?? "?"}, ${points} points, first x=${JSON.stringify(card?.visualization_data?.data?.[0]?.x)})` : "none"}`,
  );
  if (card && points === 0) {
    console.warn(`[tako] ⚠ card returned but has no visualization_data.data — raw card keys: ${Object.keys(card).join(", ")}`);
  }
  return card;
}

export async function fetchCardSeries(webpageUrl: string): Promise<TakoPoint[]> {
  const key = process.env.TAKO_API_KEY;
  console.log(`[tako] → fetchCardSeries: POST /api/v1/contents for ${webpageUrl}`);

  const contentsRes = await fetch("https://trytako.com/api/v1/contents", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-API-Key": key! },
    body: JSON.stringify({ url: webpageUrl }),
  });

  if (!contentsRes.ok) {
    const body = await contentsRes.text();
    console.error(`[tako] ✗ /contents HTTP ${contentsRes.status} — ${body.slice(0, 500)}`);
    return [];
  }

  const contentsJson = await contentsRes.json();
  const csvUrl: string | undefined = contentsJson?.contents?.[0]?.url;

  if (!csvUrl) {
    console.warn(`[tako] ⚠ /contents returned no contents[0].url — keys: ${Object.keys(contentsJson ?? {}).join(", ")}`);
    return [];
  }

  console.log(`[tako] → fetching CSV from S3: ${csvUrl.slice(0, 80)}...`);
  const csvRes = await fetch(csvUrl);

  if (!csvRes.ok) {
    console.error(`[tako] ✗ CSV fetch HTTP ${csvRes.status}`);
    return [];
  }

  const csvText = await csvRes.text();
  const lines = csvText.split("\n");
  const points: TakoPoint[] = [];

  // Skip header (line 0), parse each subsequent row
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const commaIdx = line.lastIndexOf(",");
    if (commaIdx === -1) continue;
    const x = line.slice(0, commaIdx).trim();
    const y = parseFloat(line.slice(commaIdx + 1).trim());
    if (Number.isFinite(y)) {
      points.push({ x, y });
    }
  }

  console.log(`[tako] ← parsed ${points.length} rows from CSV`);
  return points;
}
