import { GOAL_PP } from "./pp";
import type { FlightStatus } from "./schema";

export interface FlightForSummary {
  pp: number | null;
  status: FlightStatus;
  flown_at: string;
}

export interface YearPPSummary {
  confirmedPP: number;
  tentativePP: number;
  /** 搭乗日が today 以前の確定便。今日までに実際に乗った分 */
  boardedPP: number;
  goalPP: number;
  remainingPP: number;
  progress: number;
  tentativeProgress: number;
  boardedProgress: number;
  flightsCount: number;
  confirmedCount: number;
  tentativeCount: number;
}

/**
 * 年度サマリーをフライト配列から作る。
 * API とテストで同じ集計を使うために、DB アクセスから切り離している。
 *
 * 搭乗済は「未予約以外」かつ「搭乗日が today 以前」。
 * StatusPill は当日便をまだ「搭乗確定」と出すが、ダッシュボードの
 * 「今日まで」は当日分も含めて確定済みとして数える。
 */
export function summarizeYearFlights(
  flights: FlightForSummary[],
  today: string,
  goalPP = GOAL_PP
): YearPPSummary {
  const confirmed = flights.filter((r) => r.status !== "tentative");
  const tentative = flights.filter((r) => r.status === "tentative");
  const boarded = confirmed.filter((r) => r.flown_at <= today);

  const sumPP = (rows: FlightForSummary[]) => rows.reduce((s, r) => s + (r.pp ?? 0), 0);
  const confirmedPP = sumPP(confirmed);
  const tentativePP = sumPP(tentative);
  const boardedPP = sumPP(boarded);

  return {
    confirmedPP,
    tentativePP,
    boardedPP,
    goalPP,
    remainingPP: Math.max(0, goalPP - confirmedPP),
    progress: Math.min(1, confirmedPP / goalPP),
    tentativeProgress: Math.min(1, (confirmedPP + tentativePP) / goalPP),
    boardedProgress: Math.min(1, boardedPP / goalPP),
    flightsCount: flights.length,
    confirmedCount: confirmed.length,
    tentativeCount: tentative.length,
  };
}
