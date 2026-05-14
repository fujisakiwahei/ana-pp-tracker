export type CabinClass = "economy" | "first";
export type AirportCode = "HND" | "NRT" | "FUK" | "OKA" | "CTS" | "ITM" | "KIX" | "NGO" | "SDJ" | "HIJ" | "KMJ" | "KOJ" | "NGS" | "MYJ" | "OKJ" | "HKD" | "ISG" | "MMY" | "KMI" | "OIT";

export interface Route {
  from: AirportCode;
  to: AirportCode;
  baseMiles: number;
  ppEconomy: number; // 片道PP(エコノミー代表値: スタンダード相当)
  ppFirst: number; // 片道PP(ファースト代表値: スタンダード相当)
}

export const ROUTES: Route[] = [
  // 羽田(HND)発着
  { from: "HND", to: "CTS", baseMiles: 510, ppEconomy: 1016, ppFirst: 1624 },
  { from: "HND", to: "SDJ", baseMiles: 177, ppEconomy: 483, ppFirst: 825 },
  { from: "HND", to: "HKD", baseMiles: 424, ppEconomy: 878, ppFirst: 1418 },
  { from: "HND", to: "NGO", baseMiles: 193, ppEconomy: 509, ppFirst: 863 },
  { from: "HND", to: "ITM", baseMiles: 280, ppEconomy: 648, ppFirst: 1072 },
  { from: "HND", to: "KIX", baseMiles: 280, ppEconomy: 648, ppFirst: 1072 },
  { from: "HND", to: "OKJ", baseMiles: 356, ppEconomy: 770, ppFirst: 1254 },
  { from: "HND", to: "HIJ", baseMiles: 414, ppEconomy: 862, ppFirst: 1394 },
  { from: "HND", to: "MYJ", baseMiles: 438, ppEconomy: 901, ppFirst: 1451 },
  { from: "HND", to: "FUK", baseMiles: 567, ppEconomy: 1107, ppFirst: 1761 },
  { from: "HND", to: "KMJ", baseMiles: 568, ppEconomy: 1109, ppFirst: 1763 },
  { from: "HND", to: "NGS", baseMiles: 610, ppEconomy: 1176, ppFirst: 1864 },
  { from: "HND", to: "OIT", baseMiles: 499, ppEconomy: 998, ppFirst: 1598 },
  { from: "HND", to: "KMI", baseMiles: 561, ppEconomy: 1098, ppFirst: 1746 },
  { from: "HND", to: "KOJ", baseMiles: 601, ppEconomy: 1162, ppFirst: 1842 },
  { from: "HND", to: "OKA", baseMiles: 984, ppEconomy: 1774, ppFirst: 2762 },
  { from: "HND", to: "ISG", baseMiles: 1224, ppEconomy: 2158, ppFirst: 3338 },
  { from: "HND", to: "MMY", baseMiles: 1158, ppEconomy: 2053, ppFirst: 3179 },

  // 福岡(FUK)発着 (HND-FUK は HND側で定義済みのため除外)
  { from: "FUK", to: "NGO", baseMiles: 374, ppEconomy: 798, ppFirst: 1298 },
  { from: "FUK", to: "ITM", baseMiles: 287, ppEconomy: 659, ppFirst: 1089 },
  { from: "FUK", to: "KIX", baseMiles: 287, ppEconomy: 659, ppFirst: 1089 },
  { from: "FUK", to: "CTS", baseMiles: 882, ppEconomy: 1611, ppFirst: 2517 },
  { from: "FUK", to: "SDJ", baseMiles: 665, ppEconomy: 1264, ppFirst: 1996 },
  { from: "FUK", to: "OKA", baseMiles: 537, ppEconomy: 1059, ppFirst: 1689 },
  { from: "FUK", to: "MMY", baseMiles: 683, ppEconomy: 1293, ppFirst: 2039 },
  { from: "FUK", to: "ISG", baseMiles: 737, ppEconomy: 1379, ppFirst: 2169 },
  { from: "FUK", to: "KMI", baseMiles: 131, ppEconomy: 410, ppFirst: 714 },

  // 那覇(OKA)発着 (HND-OKA / FUK-OKA は上で定義済みのため除外)
  { from: "OKA", to: "NGO", baseMiles: 809, ppEconomy: 1494, ppFirst: 2342 },
  { from: "OKA", to: "ITM", baseMiles: 739, ppEconomy: 1382, ppFirst: 2174 },
  { from: "OKA", to: "KIX", baseMiles: 739, ppEconomy: 1382, ppFirst: 2174 },
  { from: "OKA", to: "CTS", baseMiles: 1397, ppEconomy: 2435, ppFirst: 3753 },
  { from: "OKA", to: "SDJ", baseMiles: 1130, ppEconomy: 2008, ppFirst: 3112 },
  { from: "OKA", to: "HIJ", baseMiles: 650, ppEconomy: 1240, ppFirst: 1960 },
  { from: "OKA", to: "MYJ", baseMiles: 607, ppEconomy: 1171, ppFirst: 1857 },
  { from: "OKA", to: "KMJ", baseMiles: 494, ppEconomy: 990, ppFirst: 1586 },
  { from: "OKA", to: "KOJ", baseMiles: 429, ppEconomy: 886, ppFirst: 1430 },
  { from: "OKA", to: "MMY", baseMiles: 177, ppEconomy: 483, ppFirst: 825 },
  { from: "OKA", to: "ISG", baseMiles: 247, ppEconomy: 595, ppFirst: 993 },
];
