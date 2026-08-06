// Shared data for the ANA PP Tracker prototype

window.AIRPORTS = {
  HND: { name: '羽田', city: '東京' },
  NRT: { name: '成田', city: '東京' },
  FUK: { name: '福岡', city: '福岡' },
  OKA: { name: '那覇', city: '沖縄' },
  CTS: { name: '新千歳', city: '札幌' },
  ITM: { name: '伊丹', city: '大阪' },
  KIX: { name: '関西', city: '大阪' },
  NGO: { name: '中部', city: '名古屋' },
  SDJ: { name: '仙台', city: '仙台' },
  HIJ: { name: '広島', city: '広島' },
  KMJ: { name: '熊本', city: '熊本' },
  KOJ: { name: '鹿児島', city: '鹿児島' },
  NGS: { name: '長崎', city: '長崎' },
  MYJ: { name: '松山', city: '松山' },
  OKJ: { name: '岡山', city: '岡山' },
  HKD: { name: '函館', city: '函館' },
  ISG: { name: '石垣', city: '石垣' },
  MMY: { name: '宮古', city: '宮古' },
  KMI: { name: '宮崎', city: '宮崎' },
  OIT: { name: '大分', city: '大分' },
};

// Subset of routes from the README
window.ROUTES = [
  // HND
  { from: 'HND', to: 'CTS', baseMiles: 510, ppEconomy: 1016, ppFirst: 1726 },
  { from: 'HND', to: 'SDJ', baseMiles: 177, ppEconomy: 483, ppFirst: 860 },
  { from: 'HND', to: 'HKD', baseMiles: 424, ppEconomy: 878, ppFirst: 1502 },
  { from: 'HND', to: 'NGO', baseMiles: 193, ppEconomy: 509, ppFirst: 902 },
  { from: 'HND', to: 'ITM', baseMiles: 280, ppEconomy: 648, ppFirst: 1128 },
  { from: 'HND', to: 'OKJ', baseMiles: 356, ppEconomy: 770, ppFirst: 1326 },
  { from: 'HND', to: 'HIJ', baseMiles: 414, ppEconomy: 862, ppFirst: 1476 },
  { from: 'HND', to: 'MYJ', baseMiles: 438, ppEconomy: 901, ppFirst: 1539 },
  { from: 'HND', to: 'FUK', baseMiles: 567, ppEconomy: 1107, ppFirst: 1874 },
  { from: 'HND', to: 'KMJ', baseMiles: 568, ppEconomy: 1109, ppFirst: 1877 },
  { from: 'HND', to: 'NGS', baseMiles: 610, ppEconomy: 1176, ppFirst: 1986 },
  { from: 'HND', to: 'OIT', baseMiles: 499, ppEconomy: 998, ppFirst: 1697 },
  { from: 'HND', to: 'KMI', baseMiles: 561, ppEconomy: 1098, ppFirst: 1859 },
  { from: 'HND', to: 'KOJ', baseMiles: 601, ppEconomy: 1162, ppFirst: 1963 },
  { from: 'HND', to: 'OKA', baseMiles: 984, ppEconomy: 1774, ppFirst: 2958 },
  { from: 'HND', to: 'ISG', baseMiles: 1224, ppEconomy: 2158, ppFirst: 3582 },
  { from: 'HND', to: 'MMY', baseMiles: 1158, ppEconomy: 2053, ppFirst: 3411 },
  // FUK
  { from: 'FUK', to: 'NGO', baseMiles: 374, ppEconomy: 798, ppFirst: 1372 },
  { from: 'FUK', to: 'ITM', baseMiles: 287, ppEconomy: 659, ppFirst: 1146 },
  { from: 'FUK', to: 'CTS', baseMiles: 882, ppEconomy: 1611, ppFirst: 2693 },
  { from: 'FUK', to: 'SDJ', baseMiles: 665, ppEconomy: 1264, ppFirst: 2129 },
  { from: 'FUK', to: 'OKA', baseMiles: 537, ppEconomy: 1059, ppFirst: 1796 },
  { from: 'FUK', to: 'MMY', baseMiles: 683, ppEconomy: 1293, ppFirst: 2176 },
  { from: 'FUK', to: 'ISG', baseMiles: 737, ppEconomy: 1379, ppFirst: 2316 },
  { from: 'FUK', to: 'KMI', baseMiles: 131, ppEconomy: 410, ppFirst: 740 },
  // OKA
  { from: 'OKA', to: 'NGO', baseMiles: 809, ppEconomy: 1494, ppFirst: 2503 },
  { from: 'OKA', to: 'ITM', baseMiles: 739, ppEconomy: 1382, ppFirst: 2321 },
  { from: 'OKA', to: 'CTS', baseMiles: 1397, ppEconomy: 2435, ppFirst: 4032 },
  { from: 'OKA', to: 'SDJ', baseMiles: 1130, ppEconomy: 2008, ppFirst: 3338 },
  { from: 'OKA', to: 'HIJ', baseMiles: 650, ppEconomy: 1240, ppFirst: 2090 },
  { from: 'OKA', to: 'MYJ', baseMiles: 607, ppEconomy: 1171, ppFirst: 1978 },
  { from: 'OKA', to: 'KMJ', baseMiles: 494, ppEconomy: 990, ppFirst: 1684 },
  { from: 'OKA', to: 'KOJ', baseMiles: 429, ppEconomy: 886, ppFirst: 1515 },
  { from: 'OKA', to: 'MMY', baseMiles: 177, ppEconomy: 483, ppFirst: 860 },
  { from: 'OKA', to: 'ISG', baseMiles: 247, ppEconomy: 595, ppFirst: 1042 },
];

window.findRoute = function(from, to) {
  return window.ROUTES.find(r =>
    (r.from === from && r.to === to) || (r.from === to && r.to === from)
  );
};

// Sample logged flights
window.FLIGHTS = [
  { id: 1, flown_at: '2026-05-05', flight_number: 'NH468', from: 'OKA', to: 'HND', cabin: 'economy', pp: 1774, aircraft: 'B777-200', seat: '42A', lounge: 'ANA LOUNGE 那覇', rating_seat: 3, rating_aircraft: 4, rating_lounge: 4, notes: '離島から戻り。窓側で雲海が綺麗だった。' },
  { id: 2, flown_at: '2026-05-03', flight_number: 'NH463', from: 'HND', to: 'OKA', cabin: 'economy', pp: 1774, aircraft: 'A321neo', seat: '28K', rating_seat: 3, rating_aircraft: 4 },
  { id: 3, flown_at: '2026-04-21', flight_number: 'NH245', from: 'FUK', to: 'OKA', cabin: 'first', pp: 1796, aircraft: 'B737-800', seat: '2A', lounge: 'ANA LOUNGE 福岡', rating_seat: 5, rating_aircraft: 4, rating_lounge: 5, notes: '短距離だがファースト快適。サンドイッチ美味しい。' },
  { id: 4, flown_at: '2026-04-19', flight_number: 'NH246', from: 'OKA', to: 'FUK', cabin: 'first', pp: 1796, aircraft: 'B737-800', seat: '2A', rating_seat: 5, rating_aircraft: 4 },
  { id: 5, flown_at: '2026-04-12', flight_number: 'NH257', from: 'FUK', to: 'HND', cabin: 'first', pp: 1874, aircraft: 'B787-9', seat: '1A', rating_seat: 5, rating_aircraft: 5 },
  { id: 6, flown_at: '2026-04-10', flight_number: 'NH256', from: 'HND', to: 'FUK', cabin: 'economy', pp: 1107, aircraft: 'B787-9', seat: '12A', lounge: 'ANA LOUNGE 羽田', rating_seat: 4, rating_aircraft: 5, rating_lounge: 4, notes: '午前便でスムーズ。' },
  { id: 7, flown_at: '2026-03-22', flight_number: 'NH413', from: 'HND', to: 'CTS', cabin: 'economy', pp: 1016, aircraft: 'A321neo', seat: '14F', rating_seat: 3, rating_aircraft: 4 },
  { id: 8, flown_at: '2026-03-20', flight_number: 'NH060', from: 'CTS', to: 'HND', cabin: 'economy', pp: 1016, aircraft: 'B767-300', seat: '22A', rating_seat: 2, rating_aircraft: 3 },
];

// Computed totals (sum of pp above)
window.TOTAL_PP = window.FLIGHTS.reduce((s, f) => s + f.pp, 0);
window.GOAL_PP = 50000;

// Suggestions: round-trips needed to hit goal from current
const remaining = window.GOAL_PP - window.TOTAL_PP;
window.SUGGESTIONS = (() => {
  const candidates = [
    { from: 'OKA', to: 'CTS', cabin: 'economy' },
    { from: 'OKA', to: 'HND', cabin: 'economy' },
    { from: 'FUK', to: 'OKA', cabin: 'first' },
    { from: 'HND', to: 'FUK', cabin: 'first' },
    { from: 'FUK', to: 'CTS', cabin: 'economy' },
    { from: 'HND', to: 'OKA', cabin: 'first' },
  ];
  return candidates.map(c => {
    const r = window.findRoute(c.from, c.to);
    const ppOneWay = c.cabin === 'first' ? r.ppFirst : r.ppEconomy;
    const ppRT = ppOneWay * 2;
    return { ...c, ppRoundTrip: ppRT, roundTripsNeeded: Math.ceil(remaining / ppRT) };
  });
})();
