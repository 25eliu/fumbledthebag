/**
 * Live smoke test for the Tako API integration.
 * Run with: npx tsx scripts/tako-verify.ts
 * Requires TAKO_API_KEY in .env
 */
import * as fs from "fs";
import * as path from "path";

// Load .env manually
const envPath = path.join(process.cwd(), ".env");
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, "utf8").split("\n");
  for (const line of lines) {
    const m = line.match(/^([A-Z_]+)=["']?(.+?)["']?\s*$/);
    if (m) process.env[m[1]] = m[2];
  }
}

const KEY = process.env.TAKO_API_KEY;
if (!KEY) {
  console.error("ERROR: TAKO_API_KEY not set");
  process.exit(1);
}

async function main() {
  const ticker = "NVDA";
  const year = 2020;
  const query = `${ticker} stock price since ${year}`;

  console.log(`\n[Step A] Searching: "${query}"`);
  const searchRes = await fetch("https://trytako.com/api/v1/knowledge_search", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-API-Key": KEY! },
    body: JSON.stringify({
      inputs: { text: query },
      source_indexes: ["tako"],
      search_effort: "fast",
      output_settings: { knowledge_card_settings: { image_dark_mode: false } },
      country_code: "US",
      locale: "en-US",
    }),
  });

  if (!searchRes.ok) {
    console.error(`Search failed: ${searchRes.status} ${await searchRes.text()}`);
    process.exit(1);
  }

  const searchJson = await searchRes.json();
  const card = searchJson?.outputs?.knowledge_cards?.[0];
  if (!card) {
    console.error("No card returned from search");
    process.exit(1);
  }
  console.log(`  card_id: ${card.card_id}`);
  console.log(`  title: ${card.title}`);
  console.log(`  card_type: ${card.card_type}`);
  console.log(`  webpage_url: ${card.webpage_url}`);
  console.log(`  visualization_data: ${card.visualization_data === null ? "null (expected)" : JSON.stringify(card.visualization_data).slice(0, 100)}`);

  console.log(`\n[Step B] Fetching contents for ${card.webpage_url}`);
  const contentsRes = await fetch("https://trytako.com/api/v1/contents", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-API-Key": KEY! },
    body: JSON.stringify({ url: card.webpage_url }),
  });

  if (!contentsRes.ok) {
    console.error(`Contents failed: ${contentsRes.status} ${await contentsRes.text()}`);
    process.exit(1);
  }

  const contentsJson = await contentsRes.json();
  const csvUrl = contentsJson?.contents?.[0]?.url;
  if (!csvUrl) {
    console.error("No CSV URL in contents response:", JSON.stringify(contentsJson).slice(0, 500));
    process.exit(1);
  }
  console.log(`  CSV URL (first 80 chars): ${csvUrl.slice(0, 80)}...`);

  console.log(`\n[Step C] Downloading and parsing CSV`);
  const csvRes = await fetch(csvUrl);
  if (!csvRes.ok) {
    console.error(`CSV fetch failed: ${csvRes.status}`);
    process.exit(1);
  }
  const csvText = await csvRes.text();
  const lines = csvText.split("\n");
  console.log(`  Header: ${lines[0]}`);

  const points: { x: string; y: number }[] = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const commaIdx = line.lastIndexOf(",");
    if (commaIdx === -1) continue;
    const x = line.slice(0, commaIdx).trim();
    const y = parseFloat(line.slice(commaIdx + 1).trim());
    if (Number.isFinite(y)) points.push({ x, y });
  }

  console.log(`\n  Total parsed rows: ${points.length}`);
  console.log(`  First point: x="${points[0]?.x}", y=${points[0]?.y}`);
  console.log(`  Last point:  x="${points[points.length - 1]?.x}", y=${points[points.length - 1]?.y}`);

  if (points.length < 100) {
    console.error(`\nFAIL: expected >100 rows, got ${points.length}`);
    process.exit(1);
  }
  console.log(`\nSMOKE TEST PASSED — ${points.length} rows parsed`);
}

main().catch((err) => {
  console.error("Unhandled error:", err);
  process.exit(1);
});
