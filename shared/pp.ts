import { ROUTES, type AirportCode, type CabinClass, type Route } from "./routes";

export const GOAL_PP = 50000;

export function findRoute(from: AirportCode, to: AirportCode): Route | undefined {
  return ROUTES.find(
    (r) =>
      (r.from === from && r.to === to) || (r.from === to && r.to === from),
  );
}

export function calcPP(
  from: AirportCode,
  to: AirportCode,
  cabin: CabinClass,
): number | null {
  const r = findRoute(from, to);
  if (!r) return null;
  return cabin === "first" ? r.ppFirst : r.ppEconomy;
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
  ppRoundTrip: number;
  roundTripsNeeded: number;
}

const SUGGESTION_CANDIDATES: Array<Omit<Suggestion, "ppRoundTrip" | "roundTripsNeeded">> = [
  { from: "OKA", to: "CTS", cabin: "economy" },
  { from: "OKA", to: "HND", cabin: "economy" },
  { from: "FUK", to: "OKA", cabin: "first" },
  { from: "HND", to: "FUK", cabin: "first" },
  { from: "FUK", to: "CTS", cabin: "economy" },
  { from: "HND", to: "OKA", cabin: "first" },
];

export function getSuggestions(remainingPP: number): Suggestion[] {
  const safeRemaining = Math.max(0, remainingPP);
  const list: Suggestion[] = [];
  for (const c of SUGGESTION_CANDIDATES) {
    const ppOneWay = calcPP(c.from, c.to, c.cabin);
    if (ppOneWay == null) continue;
    const ppRT = ppOneWay * 2;
    list.push({
      ...c,
      ppRoundTrip: ppRT,
      roundTripsNeeded: roundTripsNeeded(safeRemaining, ppRT),
    });
  }
  return list;
}

export function getCurrentYear(): number {
  return new Date().getFullYear();
}

export function buildAnaReservationUrl(
  from: AirportCode,
  to: AirportCode,
): string {
  return `https://aswbe-i.ana.co.jp/internet/dms/ic21/ICW010Action.do?depAirportCd=${from}&arrAirportCd=${to}`;
}
