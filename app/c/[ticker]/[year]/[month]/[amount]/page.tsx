import type { Metadata } from "next";
import { headers } from "next/headers";
import BagApp from "@/components/BagApp";
import { canonicalPath } from "@/lib/url";
import type { BagResult, BagError } from "@/lib/types";
import { buildOgTitle } from "@/app/c/og-title";

type Params = { ticker: string; year: string; month: string; amount: string };

function parseParams(p: Params) {
  return {
    ticker: decodeURIComponent(p.ticker).toUpperCase(),
    year: Number(p.year),
    month: Number(p.month),
    amount: Number(p.amount),
  };
}

function baseUrl(): string {
  const h = headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? "http";
  return `${proto}://${host}`;
}

async function fetchResult(values: ReturnType<typeof parseParams>): Promise<BagResult | BagError> {
  const res = await fetch(`${baseUrl()}/api/bagcheck`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(values),
    cache: "no-store",
  });
  return res.json();
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const values = parseParams(params);
  const data = await fetchResult(values);
  const ogImage = `/api/og/${values.ticker}/${values.year}/${values.month}/${values.amount}`;
  const title = "error" in data ? "fumbledthebag 🧢" : buildOgTitle(data);
  return {
    title,
    openGraph: { title, images: [{ url: ogImage, width: 1200, height: 630 }], url: canonicalPath(values) },
    twitter: { card: "summary_large_image", title, images: [ogImage] },
  };
}

export default async function ResultPage({ params }: { params: Params }) {
  const values = parseParams(params);
  const data = await fetchResult(values);
  const initialResult = "error" in data ? undefined : data;
  return <BagApp initial={values} initialResult={initialResult} />;
}
