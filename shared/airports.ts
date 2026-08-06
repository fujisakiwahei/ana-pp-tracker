export interface Airport {
  name: string;
  city: string;
}

/**
 * 空港マスタ。**空港コードの唯一の定義元**。
 *
 * `AirportCode` 型も Zod の `airportCodeSchema` もすべてここから導出するため、
 * 空港を増やすときはこのオブジェクトに1行足すだけでよい。
 *
 * 以前は同じ23件の一覧が routes.ts の union / schema.ts の z.enum /
 * このファイルの3箇所に手書きされており、schema.ts の更新漏れで
 * 「フォームには出るが保存すると400になる空港」が生まれていた (f3b3d57)。
 *
 * ※ ここに載っていても路線データ(ROUTES)が無い空港は、フォームの選択肢には出ない。
 *    選択肢は routes.ts の SELECTABLE_AIRPORT_CODES として ROUTES から導出している。
 */
export const AIRPORTS = {
  HND: { name: "羽田", city: "東京" },
  NRT: { name: "成田", city: "東京" },
  FUK: { name: "福岡", city: "福岡" },
  OKA: { name: "那覇", city: "沖縄" },
  CTS: { name: "新千歳", city: "札幌" },
  WKJ: { name: "稚内", city: "稚内" },
  KUH: { name: "釧路", city: "釧路" },
  SHB: { name: "中標津", city: "中標津" },
  ITM: { name: "伊丹", city: "大阪" },
  KIX: { name: "関西", city: "大阪" },
  NGO: { name: "中部", city: "名古屋" },
  SDJ: { name: "仙台", city: "仙台" },
  HIJ: { name: "広島", city: "広島" },
  KMJ: { name: "熊本", city: "熊本" },
  KOJ: { name: "鹿児島", city: "鹿児島" },
  NGS: { name: "長崎", city: "長崎" },
  MYJ: { name: "松山", city: "松山" },
  OKJ: { name: "岡山", city: "岡山" },
  HKD: { name: "函館", city: "函館" },
  ISG: { name: "石垣", city: "石垣" },
  MMY: { name: "宮古", city: "宮古" },
  KMI: { name: "宮崎", city: "宮崎" },
  OIT: { name: "大分", city: "大分" },
} as const satisfies Record<string, Airport>;

export type AirportCode = keyof typeof AIRPORTS;

/** 空港コードの一覧。Zod の `z.enum()` に渡せるよう非空タプルとして公開する。 */
export const AIRPORT_CODES = Object.keys(AIRPORTS) as [AirportCode, ...AirportCode[]];
