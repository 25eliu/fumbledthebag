export type TakoPoint = { x: string; y: number };

export type TakoCard = {
  card_id: string;
  title: string;
  description: string;
  webpage_url: string;
  image_url: string;
  embed_url: string;
  confidence?: string;
  visualization_data?: { data: TakoPoint[]; viz_config?: Record<string, unknown> };
};

export type Scale = "everyday" | "aspirational" | "flex" | "absurd";
export type Item = { icon: string; name: string; price: number; scale: Scale; url: string; blurb: string };
export type PickedItem = Item & { qty: number };

export type BagMath = {
  startPrice: number;
  startDateActual: string; // "YYYY-MM"
  currentPrice: number;
  currentDate: string; // "YYYY-MM"
  multiple: number;
  currentValue: number;
  gain: number;
  returnPct: number;
  snapped: boolean;
  isLoss: boolean;
};

export type Benchmark = {
  label: string;
  currentValue: number;
  gain: number;
  multiple: number;
};

export type BagResult = BagMath & {
  ticker: string;
  year: number;
  month: number;
  amount: number;
  embedUrl: string;
  imageUrl: string;
  confidence?: string;
  benchmark?: Benchmark;
};

export type BagErrorCode = "NO_DATA" | "IPO_AFTER" | "BAD_REQUEST";
export type BagError = {
  error: BagErrorCode;
  message: string;
  suggestedYear?: number;
  suggestedMonth?: number;
};
