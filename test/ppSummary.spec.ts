import { describe, expect, it } from "vitest";
import { GOAL_PP } from "../shared/pp";
import { summarizeYearFlights } from "../shared/ppSummary";
import type { FlightForSummary } from "../shared/ppSummary";

const TODAY = "2026-09-02";

function flight(
  partial: Pick<FlightForSummary, "pp" | "flown_at"> & Partial<FlightForSummary>
): FlightForSummary {
  return { status: "confirmed", ...partial };
}

describe("summarizeYearFlights", () => {
  it("空ならすべて0になる", () => {
    expect(summarizeYearFlights([], TODAY)).toEqual({
      confirmedPP: 0,
      tentativePP: 0,
      boardedPP: 0,
      goalPP: GOAL_PP,
      remainingPP: GOAL_PP,
      progress: 0,
      tentativeProgress: 0,
      boardedProgress: 0,
      flightsCount: 0,
      confirmedCount: 0,
      tentativeCount: 0,
    });
  });

  it("今日までの確定便だけを搭乗済PPに入れる", () => {
    const rows = [
      flight({ pp: 1000, flown_at: "2026-08-31" }),
      flight({ pp: 500, flown_at: TODAY }),
      flight({ pp: 800, flown_at: "2026-10-01" }),
      flight({ pp: 300, flown_at: "2026-07-01", status: "tentative" }),
    ];

    const s = summarizeYearFlights(rows, TODAY);
    expect(s.confirmedPP).toBe(2300);
    expect(s.tentativePP).toBe(300);
    expect(s.boardedPP).toBe(1500);
    expect(s.confirmedCount).toBe(3);
    expect(s.tentativeCount).toBe(1);
    expect(s.flightsCount).toBe(4);
    expect(s.remainingPP).toBe(GOAL_PP - 2300);
    expect(s.progress).toBe(2300 / GOAL_PP);
    expect(s.tentativeProgress).toBe(2600 / GOAL_PP);
    expect(s.boardedProgress).toBe(1500 / GOAL_PP);
  });

  it("当日便は搭乗済に含める", () => {
    const s = summarizeYearFlights([flight({ pp: 851, flown_at: TODAY })], TODAY);
    expect(s.boardedPP).toBe(851);
    expect(s.confirmedPP).toBe(851);
  });

  it("未来の確定便は達成率には入るが搭乗済には入らない", () => {
    const s = summarizeYearFlights([flight({ pp: 2000, flown_at: "2026-12-24" })], TODAY);
    expect(s.confirmedPP).toBe(2000);
    expect(s.boardedPP).toBe(0);
    expect(s.progress).toBeGreaterThan(0);
    expect(s.boardedProgress).toBe(0);
  });

  it("未予約の過去便は搭乗済に数えない", () => {
    const s = summarizeYearFlights(
      [flight({ pp: 900, flown_at: "2026-01-10", status: "tentative" })],
      TODAY
    );
    expect(s.boardedPP).toBe(0);
    expect(s.tentativePP).toBe(900);
    expect(s.confirmedPP).toBe(0);
  });

  it("pp が null の行は 0 として扱う", () => {
    const s = summarizeYearFlights([flight({ pp: null, flown_at: "2026-03-01" })], TODAY);
    expect(s.confirmedPP).toBe(0);
    expect(s.boardedPP).toBe(0);
    expect(s.confirmedCount).toBe(1);
  });
});
