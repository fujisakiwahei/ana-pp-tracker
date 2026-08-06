import { serverSupabaseClient } from "#supabase/server";
import type { Database } from "~~/shared/database.types";
import { requireUser } from "~~/server/utils/auth";
import { GOAL_PP, getCurrentYear } from "~~/shared/pp";

export default defineEventHandler(async (event) => {
  const user = await requireUser(event);
  const client = await serverSupabaseClient<Database>(event);

  const query = getQuery(event);
  const year = Number(query.year ?? getCurrentYear());
  const start = `${year}-01-01`;
  const end = `${year}-12-31`;

  const { data, error } = await client
    .from("flights")
    .select("pp, status")
    .eq("user_id", user.id)
    .gte("flown_at", start)
    .lte("flown_at", end);

  if (error) {
    throw createError({ statusCode: 500, statusMessage: error.message });
  }

  const flights = data ?? [];
  // status は NOT NULL DEFAULT 'confirmed' なので必ず入っている。
  // 将来ステータスが増えても「未予約以外は確定扱い」で通るよう !== で判定する。
  const confirmed = flights.filter((r) => r.status !== "tentative");
  const tentative = flights.filter((r) => r.status === "tentative");
  const confirmedPP = confirmed.reduce((s, r) => s + (r.pp ?? 0), 0);
  const tentativePP = tentative.reduce((s, r) => s + (r.pp ?? 0), 0);

  // 目標達成は確定PPのみで判定。未予約は見込みとして別枠。
  const remainingPP = Math.max(0, GOAL_PP - confirmedPP);
  const progress = Math.min(1, confirmedPP / GOAL_PP);
  const tentativeProgress = Math.min(1, (confirmedPP + tentativePP) / GOAL_PP);

  return {
    year,
    confirmedPP,
    tentativePP,
    goalPP: GOAL_PP,
    remainingPP,
    progress,
    tentativeProgress,
    flightsCount: flights.length,
    confirmedCount: confirmed.length,
    tentativeCount: tentative.length,
  };
});
