import { type AirportCode, type CabinClass } from "./routes";

/**
 * 路線×クラスの実勢相場（片道・円）。
 * goodPrice 以下なら「お得（買い）」、okPrice を超えると「高い」。
 * ※ ANA 予約サイト/運賃の実勢をもとにしたざっくり目安。相場変動に応じて随時更新。
 */
export interface MarketFare {
  /** お得ライン: これ以下なら買い */
  goodPrice: number;
  /** 許容ライン: これを超えると高い */
  okPrice: number;
}

/**
 * 1 路線ぶんの相場。プレミアム（first）販売が薄い路線は first を null にする。
 * from/to の向きは任意（lookupMarket が双方向にマッチする）。
 */
export interface RouteMarket {
  from: AirportCode;
  to: AirportCode;
  economy: MarketFare;
  first: MarketFare | null;
}

export type FareBand = "good" | "ok" | "high";

/**
 * 主要路線の実勢相場（片道・円）。
 * PP 単価は「最安クラスで現実的に買える代表価格」を想定し、PP は代表運賃 = simple
 * （新運賃: economy 70%/+100、first 120%/+400）で評価する前提。
 * SUPER VALUE ≒ simple であることを実 PP 値で確認済み。
 */
const MARKET_FARES: RouteMarket[] = [
  {
    from: "HND",
    to: "OKA",
    economy: { goodPrice: 14000, okPrice: 22000 },
    first: { goodPrice: 33000, okPrice: 42000 },
  },
  {
    from: "HND",
    to: "ISG",
    economy: { goodPrice: 17000, okPrice: 27000 },
    first: { goodPrice: 40000, okPrice: 52000 },
  },
  {
    from: "HND",
    to: "MMY",
    economy: { goodPrice: 16000, okPrice: 26000 },
    first: { goodPrice: 38000, okPrice: 50000 },
  },
  {
    from: "HND",
    to: "CTS",
    economy: { goodPrice: 9000, okPrice: 14000 },
    first: { goodPrice: 22000, okPrice: 30000 },
  },
  {
    from: "HND",
    to: "FUK",
    economy: { goodPrice: 10000, okPrice: 15000 },
    first: { goodPrice: 24000, okPrice: 32000 },
  },
  {
    from: "HND",
    to: "ITM",
    economy: { goodPrice: 8000, okPrice: 12000 },
    first: { goodPrice: 18000, okPrice: 25000 },
  },
  {
    from: "HND",
    to: "KIX",
    economy: { goodPrice: 8000, okPrice: 12000 },
    first: { goodPrice: 18000, okPrice: 25000 },
  },
  {
    from: "FUK",
    to: "OKA",
    economy: { goodPrice: 9500, okPrice: 14000 },
    first: { goodPrice: 21000, okPrice: 28000 },
  },
  {
    from: "FUK",
    to: "CTS",
    economy: { goodPrice: 13000, okPrice: 20000 },
    first: { goodPrice: 30000, okPrice: 40000 },
  },
  {
    from: "OKA",
    to: "CTS",
    economy: { goodPrice: 20000, okPrice: 30000 },
    first: { goodPrice: 45000, okPrice: 58000 },
  },
  {
    from: "OKA",
    to: "ISG",
    economy: { goodPrice: 6000, okPrice: 10000 },
    first: { goodPrice: 13000, okPrice: 18000 },
  },
  {
    from: "OKA",
    to: "MMY",
    economy: { goodPrice: 5000, okPrice: 9000 },
    first: { goodPrice: 11000, okPrice: 16000 },
  },
  { from: "FUK", to: "ISG", economy: { goodPrice: 12000, okPrice: 19000 }, first: null },
];

/** from/to を順不同でマッチ（findRoute と同じ双方向思想）。 */
export function lookupMarket(
  from: AirportCode,
  to: AirportCode,
  cabin: CabinClass
): MarketFare | null {
  const m = MARKET_FARES.find(
    (r) => (r.from === from && r.to === to) || (r.from === to && r.to === from)
  );
  if (!m) return null;
  return cabin === "first" ? m.first : m.economy;
}

/** 円/PP。pp が null/0 以下なら null（0 除算を防ぐ）。 */
export function yenPerPP(price: number, pp: number | null): number | null {
  if (!pp || pp <= 0) return null;
  return price / pp;
}

/** good 以下→"good" / ok 超→"high" / それ以外→"ok"。 */
export function classifyByPrice(price: number, good: number, ok: number): FareBand {
  if (price <= good) return "good";
  if (price > ok) return "high";
  return "ok";
}
