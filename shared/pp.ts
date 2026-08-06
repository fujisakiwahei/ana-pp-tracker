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

/**
 * 片道PPを計算。
 * 式: floor(baseMiles × 積算率 × 路線倍率(=2)) + 搭乗ポイント
 * ※ ANA は端数切り捨て（例: FUK-OKA 537mi × 75% × 2 = 805.5 → 805 PP）。
 */
export function calcPP(
  from: AirportCode,
  to: AirportCode,
  cabin: CabinClass,
  fareType: FareType | undefined,
  flownAt: string,
): number | null {
  const route = findRoute(from, to);
  if (!route) return null;
  const lane = resolveRate(flownAt, cabin, fareType);
  if (!lane) return null;
  const accrued = Math.floor(route.baseMiles * (lane.rate / 100) * DOMESTIC_ROUTE_MULTIPLIER);
  return accrued + lane.boarding;
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

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function getCurrentYear(): number {
  return new Date().getFullYear();
}

export function buildAnaReservationUrl(
  _from: AirportCode,
  _to: AirportCode,
): string {
  return "https://www.ana.co.jp/ja/jp/";
}

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
