import type { AirportCode } from "./routes";

export interface Airport {
  code: AirportCode;
  name: string;
  city: string;
}

export const AIRPORTS: Record<AirportCode, Airport> = {
  HND: { code: "HND", name: "羽田", city: "東京" },
  NRT: { code: "NRT", name: "成田", city: "東京" },
  FUK: { code: "FUK", name: "福岡", city: "福岡" },
  OKA: { code: "OKA", name: "那覇", city: "沖縄" },
  CTS: { code: "CTS", name: "新千歳", city: "札幌" },
  WKJ: { code: "WKJ", name: "稚内", city: "稚内" },
  KUH: { code: "KUH", name: "釧路", city: "釧路" },
  SHB: { code: "SHB", name: "中標津", city: "中標津" },
  ITM: { code: "ITM", name: "伊丹", city: "大阪" },
  KIX: { code: "KIX", name: "関西", city: "大阪" },
  NGO: { code: "NGO", name: "中部", city: "名古屋" },
  SDJ: { code: "SDJ", name: "仙台", city: "仙台" },
  HIJ: { code: "HIJ", name: "広島", city: "広島" },
  KMJ: { code: "KMJ", name: "熊本", city: "熊本" },
  KOJ: { code: "KOJ", name: "鹿児島", city: "鹿児島" },
  NGS: { code: "NGS", name: "長崎", city: "長崎" },
  MYJ: { code: "MYJ", name: "松山", city: "松山" },
  OKJ: { code: "OKJ", name: "岡山", city: "岡山" },
  HKD: { code: "HKD", name: "函館", city: "函館" },
  ISG: { code: "ISG", name: "石垣", city: "石垣" },
  MMY: { code: "MMY", name: "宮古", city: "宮古" },
  KMI: { code: "KMI", name: "宮崎", city: "宮崎" },
  OIT: { code: "OIT", name: "大分", city: "大分" },
};

export const AIRPORT_CODES = Object.keys(AIRPORTS) as AirportCode[];
