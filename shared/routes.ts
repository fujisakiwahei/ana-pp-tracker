import { AIRPORT_CODES, type AirportCode } from "./airports";

// 空港コードの定義元は airports.ts。従来どおり routes.ts からも型を参照できるよう再エクスポートする。
export type { AirportCode };

/** 座席クラス。**値リストの唯一の定義元**で、Zod の cabinClassSchema もここから導出する。 */
export const CABIN_CLASSES = ["economy", "first"] as const;
export type CabinClass = (typeof CABIN_CLASSES)[number];

/** 座席クラスの表示名。Record<CabinClass, string> なのでクラス追加時にラベルが型で強制される。 */
export const CABIN_LABELS: Record<CabinClass, string> = {
  economy: "エコノミー",
  first: "プレミアム",
};

/** Segmented / select にそのまま渡せるクラス選択肢。 */
export const CABIN_OPTIONS: Array<{ value: CabinClass; label: string }> = CABIN_CLASSES.map(
  (value) => ({ value, label: CABIN_LABELS[value] })
);

/** 運賃種別。**値リストの唯一の定義元**で、Zod の fareTypeSchema もここから導出する。 */
export const FARE_TYPES = [
  "flex",
  "biz",
  "standard",
  "simple",
  "sale",
  "ana_card",
  "stockholder",
  "shimin",
] as const;
export type FareType = (typeof FARE_TYPES)[number];

/**
 * 運賃種別の表示名。
 * `Record<FareType, string>` なので、運賃を増やすとラベルの追加が型で強制される。
 */
export const FARE_TYPE_LABELS: Record<FareType, string> = {
  flex: "フレックス",
  biz: "ビジネスきっぷ / Biz",
  standard: "スタンダード",
  simple: "シンプル",
  sale: "セール運賃",
  ana_card: "ANAカード優待割引",
  stockholder: "株主優待割引",
  shimin: "島民割引",
};

export interface Route {
  from: AirportCode;
  to: AirportCode;
  baseMiles: number;
}

export const ROUTES: Route[] = [
  // 羽田(HND)発着
  { from: "HND", to: "WKJ", baseMiles: 700 },
  { from: "HND", to: "SHB", baseMiles: 605 },
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

/**
 * フォームで選べる空港。**ROUTES に登場する空港だけ**を空港マスタの順で返す。
 *
 * 空港マスタに載っていても路線データが無い空港 (現状は NRT) は、選んでも
 * calcPP() が null を返して保存時に400になる。手で一覧を書くとまたズレるので、
 * ROUTES から導出して「選べる = 保存できる」を保証する。
 * NRT を使いたくなったら ROUTES に成田路線を追加すれば自動で選択肢に出る。
 */
export const SELECTABLE_AIRPORT_CODES: AirportCode[] = AIRPORT_CODES.filter((code) =>
  ROUTES.some((r) => r.from === code || r.to === code)
);
