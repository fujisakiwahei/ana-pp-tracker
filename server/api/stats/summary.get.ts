import { serverSupabaseServiceRole } from "#supabase/server";
import { requireUser } from "~~/server/utils/auth";
import { GOAL_PP, getCurrentYear } from "~~/shared/pp";

export default defineEventHandler(async (event) => {
  const user = await requireUser(event);
  const client = serverSupabaseServiceRole(event);

  const query = getQuery(event);
  const year = Number(query.year ?? getCurrentYear());
  const start = `${year}-01-01`;
  const end = `${year}-12-31`;

  const { data, error } = await client
    .from("flights")
    .select("pp")
    .eq("user_id", user.id)
    .gte("flown_at", start)
    .lte("flown_at", end);

  if (error) {
    throw createError({ statusCode: 500, statusMessage: error.message });
  }

  const flights = data ?? [];
  const totalPP = flights.reduce((s, r) => s + (r.pp ?? 0), 0);
  const remainingPP = Math.max(0, GOAL_PP - totalPP);
  const progress = Math.min(1, totalPP / GOAL_PP);

  return {
    year,
    totalPP,
    goalPP: GOAL_PP,
    remainingPP,
    progress,
    flightsCount: flights.length,
  };
});
