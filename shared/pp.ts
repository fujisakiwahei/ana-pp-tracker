import { ROUTES, type AirportCode, type CabinClass, type FareType, type Route } from "./routes";
import type { FlightInput } from "./schema";

export const GOAL_PP = 50000;

/**
 * 2026/5/19 搭乗分から国内線運賃が新体系に切替（搭乗日基準・YYYY-MM-DD で文字列比較可能）。
 */
export const FARE_CHANGE_DATE = "2026-05-19";

/** 国内線 路線倍率 */
export const DOMESTIC_ROUTE_MULTIPLIER = 2;

interface FareRate {
  /** 積算率 (% 単位、例: 75 = 75%) */
  rate: number;
  /** 搭乗ポイント (片道) */
  boarding: number;
}

type FareEntry = { economy: FareRate; first: FareRate | null };

/**
 * 旧運賃 (〜 2026/5/18 搭乗)
 * 出典: https://www.ana.co.jp/amcservice/pps/dom_unchin_list.html
 */
const FARE_RATES_OLD: Record<FareType, FareEntry> = {
  flex:        { economy: { rate: 100, boarding: 400 }, first: { rate: 150, boarding: 400 } },
  biz:         { economy: { rate: 100, boarding: 400 }, first: { rate: 150, boarding: 400 } },
  standard:    { economy: { rate: 75,  boarding: 400 }, first: { rate: 125, boarding: 400 } },
  simple:      { economy: { rate: 75,  boarding: 0   }, first: { rate: 125, boarding: 400 } },
  sale:        { economy: { rate: 50,  boarding: 0   }, first: null },
  ana_card:    { economy: { rate: 100, boarding: 400 }, first: { rate: 150, boarding: 400 } },
  stockholder: { economy: { rate: 75,  boarding: 400 }, first: { rate: 125, boarding: 400 } },
  shimin:      { economy: { rate: 100, boarding: 0   }, first: null },
};

/**
 * 新運賃 (2026/5/19 搭乗〜)
 * 出典: https://www.ana.co.jp/amcservice/pps/dom_unchin_list.html
 */
const FARE_RATES_NEW: Record<FareType, FareEntry> = {
  flex:        { economy: { rate: 100, boarding: 400 }, first: { rate: 150, boarding: 400 } },
  biz:         { economy: { rate: 100, boarding: 400 }, first: { rate: 150, boarding: 400 } },
  standard:    { economy: { rate: 80,  boarding: 200 }, first: { rate: 130, boarding: 400 } },
  simple:      { economy: { rate: 70,  boarding: 100 }, first: { rate: 120, boarding: 400 } },
  sale:        { economy: { rate: 50,  boarding: 0   }, first: { rate: 100, boarding: 0 } },
  ana_card:    { economy: { rate: 100, boarding: 400 }, first: { rate: 150, boarding: 400 } },
  stockholder: { economy: { rate: 80,  boarding: 400 }, first: { rate: 130, boarding: 400 } },
  shimin:      { economy: { rate: 100, boarding: 0   }, first: null },
};

/**
 * fare_type 未指定時のフォールバック。
 * 旧 = スタンダード相当 (economy 100% / first 125%、いずれも +400)
 * 新 = スタンダード相当 (economy 80%+200 / first 130%+400)
 */
const DEFAULT_RATE_OLD: FareEntry = {
  economy: { rate: 100, boarding: 400 },
  first: { rate: 125, boarding: 400 },
};
const DEFAULT_RATE_NEW: FareEntry = {
  economy: { rate: 80, boarding: 200 },
  first: { rate: 130, boarding: 400 },
};

export function isNewFareEra(flownAt: string): boolean {
  return flownAt >= FARE_CHANGE_DATE;
}

export function findRoute(from: AirportCode, to: AirportCode): Route | undefined {
  return ROUTES.find(
    (r) =>
      (r.from === from && r.to === to) || (r.from === to && r.to === from),
  );
}

function resolveRate(
  flownAt: string,
  cabin: CabinClass,
  fareType: FareType | undefined,
): FareRate | null {
  const isNew = isNewFareEra(flownAt);
  const entry: FareEntry = fareType
    ? (isNew ? FARE_RATES_NEW : FARE_RATES_OLD)[fareType]
    : (isNew ? DEFAULT_RATE_NEW : DEFAULT_RATE_OLD);
  if (!entry) return null;
  return cabin === "first" ? entry.first : entry.economy;
}

/** 片道PPの内訳。UI が「積算率」「搭乗ポイント」を表示するために使う。 */
export interface PPBreakdown {
  /** 区間基本マイル */
  baseMiles: number;
  /** 積算率 (% 単位、例: 75 = 75%) */
  rate: number;
  /** 路線倍率 (国内線は常に 2) */
  multiplier: number;
  /** 積算マイル分のPP（端数切り捨て後） */
  accrued: number;
  /** 搭乗ポイント (片道) */
  boarding: number;
  /** 合計PP = accrued + boarding */
  total: number;
  /** 新運賃体系 (2026/5/19 搭乗〜) か */
  isNewEra: boolean;
}

/**
 * 片道PPを内訳付きで計算。
 * 式: floor(baseMiles × 積算率 × 路線倍率(=2)) + 搭乗ポイント
 * ※ ANA は端数切り捨て（例: FUK-OKA 537mi × 75% × 2 = 805.5 → 805 PP）。
 *
 * 合計だけでなく内訳を返すのは、UI が積算率と搭乗ポイントを表示するため。
 * 以前は合計PPからそれらを逆算していたが、`accrued + boarding = total` は
 * 解が一意に定まらず、実際に 328通り中177通りで誤った値を表示していた。
 */
export function calcPPBreakdown(
  from: AirportCode,
  to: AirportCode,
  cabin: CabinClass,
  fareType: FareType | undefined,
  flownAt: string,
): PPBreakdown | null {
  const route = findRoute(from, to);
  if (!route) return null;
  const lane = resolveRate(flownAt, cabin, fareType);
  if (!lane) return null;
  const accrued = Math.floor(route.baseMiles * (lane.rate / 100) * DOMESTIC_ROUTE_MULTIPLIER);
  return {
    baseMiles: route.baseMiles,
    rate: lane.rate,
    multiplier: DOMESTIC_ROUTE_MULTIPLIER,
    accrued,
    boarding: lane.boarding,
    total: accrued + lane.boarding,
    isNewEra: isNewFareEra(flownAt),
  };
}

/** 片道PPの合計だけが必要なとき用。内訳が要るなら calcPPBreakdown を使う。 */
export function calcPP(
  from: AirportCode,
  to: AirportCode,
  cabin: CabinClass,
  fareType: FareType | undefined,
  flownAt: string,
): number | null {
  return calcPPBreakdown(from, to, cabin, fareType, flownAt)?.total ?? null;
}

export function roundTripsNeeded(remaining: number, ppRoundTrip: number): number {
  if (ppRoundTrip <= 0) return Infinity;
  if (remaining <= 0) return 0;
  return Math.ceil(remaining / ppRoundTrip);
}

export interface Suggestion {
  from: AirportCode;
  to: AirportCode;
  cabin: CabinClass;
  fareType: FareType;
  ppRoundTrip: number;
  roundTripsNeeded: number;
}

const SUGGESTION_CANDIDATES: Array<Pick<Suggestion, "from" | "to">> = [
  { from: "FUK", to: "OKA" },
  { from: "FUK", to: "CTS" },
  { from: "OKA", to: "HND" },
  { from: "FUK", to: "HND" },
];

export function getSuggestions(
  remainingPP: number,
  cabin: CabinClass,
  fareType: FareType = "simple",
  flownAt: string = todayISO(),
): Suggestion[] {
  const safeRemaining = Math.max(0, remainingPP);
  const list: Suggestion[] = [];
  for (const c of SUGGESTION_CANDIDATES) {
    const ppOneWay = calcPP(c.from, c.to, cabin, fareType, flownAt);
    if (ppOneWay == null) continue;
    const ppRT = ppOneWay * 2;
    list.push({
      from: c.from,
      to: c.to,
      cabin,
      fareType,
      ppRoundTrip: ppRT,
      roundTripsNeeded: roundTripsNeeded(safeRemaining, ppRT),
    });
  }
  return list;
}

/** 今日の日付 (YYYY-MM-DD)。搭乗日の既定値・過去判定に使う。 */
export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function getCurrentYear(): number {
  return new Date().getFullYear();
}

/**
 * 路線カードからの予約導線。
 * 区間を指定したディープリンクの仕様が公開されていないため、ANA のトップページに送る。
 * (以前は from/to を受け取りながら両方とも捨てて固定URLを返す関数で、
 *  区間ごとにURLが変わるかのように見えるシグネチャになっていた)
 */
export const ANA_RESERVATION_URL = "https://www.ana.co.jp/ja/jp/";

/**
 * 入力から実際に記録するPPを決める。
 * 手入力の上書きがあればそれを、無ければ路線テーブルから自動計算する。
 * 自動計算できない組み合わせ（路線が無い / その運賃にそのクラスが無い）は null。
 *
 * サーバの登録・更新・CSV取り込みと、CSVプレビュー画面で共有する。
 */
export function resolvePP(input: FlightInput): number | null {
  if (input.pp != null) return input.pp;
  return calcPP(
    input.from_airport,
    input.to_airport,
    input.cabin,
    input.fare_type,
    input.flown_at,
  );
}

/** resolvePP が null を返したときにユーザーへ出す文言。3つのAPIで共有する。 */
export const PP_RESOLVE_ERROR_MESSAGE =
  "PP の自動計算に失敗しました。該当する路線・運賃の組み合わせがテーブルにないため、PP を手動で入力してください。";
