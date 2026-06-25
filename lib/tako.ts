import type { TakoCard } from "@/lib/types";

export async function takoSearch(text: string): Promise<TakoCard | null> {
  const res = await fetch("https://trytako.com/api/v1/knowledge_search", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-API-Key": process.env.TAKO_API_KEY! },
    body: JSON.stringify({
      inputs: { text },
      source_indexes: ["tako"],
      search_effort: "fast",
      output_settings: { knowledge_card_settings: { image_dark_mode: false } },
      country_code: "US",
      locale: "en-US",
    }),
  });
  if (!res.ok) throw new Error(`Tako ${res.status}: ${await res.text()}`);
  const json = await res.json();
  return json?.outputs?.knowledge_cards?.[0] ?? null;
}
