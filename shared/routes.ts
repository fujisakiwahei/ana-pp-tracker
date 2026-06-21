export type CabinClass = "economy" | "first";
export type AirportCode =
  | "HND"
  | "NRT"
  | "FUK"
  | "OKA"
  | "CTS"
  | "ITM"
  | "KIX"
  | "NGO"
  | "SDJ"
  | "HIJ"
  | "KMJ"
  | "KOJ"
  | "NGS"
  | "MYJ"
  | "OKJ"
  | "HKD"
  | "ISG"
  | "MMY"
  | "KMI"
  | "OIT"
  | "WKJ"
  | "KUH";

export type FareType =
  | "flex"
  | "biz"
  | "standard"
  | "simple"
  | "sale"
  | "ana_card"
  | "stockholder"
  | "shimin";

export interface Route {
  from: AirportCode;
  to: AirportCode;
  baseMiles: number;
}

export const ROUTES: Route[] = [
  // 羽田(HND)発着
  { from: "HND", to: "WKJ", baseMiles: 700 },
  { from: "HND", to: "KUH", baseMiles: 575 },
  { from: "HND", to: "CTS", baseMiles: 510 },
  { from: "HND", to: "SDJ", baseMiles: 177 },
  { from: "HND", to: "HKD", baseMiles: 424 },
  { from: "HND", to: "NGO", baseMiles: 193 },
  { from: "HND", to: "ITM", baseMiles: 280 },
  { from: "HND", to: "KIX", baseMiles: 280 },
  { from: "HND", to: "OKJ", baseMiles: 356 },
  { from: "HND", to: "HIJ", baseMiles: 414 },
  { from: "HND", to: "MYJ", baseMiles: 438 },
  { from: "HND", to: "FUK", baseMiles: 567 },
  { from: "HND", to: "KMJ", baseMiles: 568 },
  { from: "HND", to: "NGS", baseMiles: 610 },
  { from: "HND", to: "OIT", baseMiles: 499 },
  { from: "HND", to: "KMI", baseMiles: 561 },
  { from: "HND", to: "KOJ", baseMiles: 601 },
  { from: "HND", to: "OKA", baseMiles: 984 },
  { from: "HND", to: "ISG", baseMiles: 1224 },
  { from: "HND", to: "MMY", baseMiles: 1158 },

  // 福岡(FUK)発着 (HND-FUK は HND側で定義済みのため除外)
  { from: "FUK", to: "NGO", baseMiles: 374 },
  { from: "FUK", to: "ITM", baseMiles: 287 },
  { from: "FUK", to: "KIX", baseMiles: 287 },
  { from: "FUK", to: "CTS", baseMiles: 882 },
  { from: "FUK", to: "SDJ", baseMiles: 665 },
  { from: "FUK", to: "OKA", baseMiles: 537 },
  { from: "FUK", to: "MMY", baseMiles: 683 },
  { from: "FUK", to: "ISG", baseMiles: 737 },
  { from: "FUK", to: "KMI", baseMiles: 131 },

  // 那覇(OKA)発着 (HND-OKA / FUK-OKA は上で定義済みのため除外)
  { from: "OKA", to: "NGO", baseMiles: 809 },
  { from: "OKA", to: "ITM", baseMiles: 739 },
  { from: "OKA", to: "KIX", baseMiles: 739 },
  { from: "OKA", to: "CTS", baseMiles: 1397 },
  { from: "OKA", to: "SDJ", baseMiles: 1130 },
  { from: "OKA", to: "HIJ", baseMiles: 650 },
  { from: "OKA", to: "MYJ", baseMiles: 607 },
  { from: "OKA", to: "KMJ", baseMiles: 494 },
  { from: "OKA", to: "KOJ", baseMiles: 429 },
  { from: "OKA", to: "MMY", baseMiles: 177 },
  { from: "OKA", to: "ISG", baseMiles: 247 },
];
