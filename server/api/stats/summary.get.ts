import { serverSupabaseClient } from "#supabase/server";
import type { Database } from "~~/shared/database.types";
import { requireUser } from "~~/server/utils/auth";
import { getCurrentYear, todayISO } from "~~/shared/pp";
import { summarizeYearFlights } from "~~/shared/ppSummary";

export default defineEventHandler(async (event) => {
  const user = await requireUser(event);
  const client = await serverSupabaseClient<Database>(event);

  const query = getQuery(event);
  const year = Number(query.year ?? getCurrentYear());
  const start = `${year}-01-01`;
  const end = `${year}-12-31`;

  const { data, error } = await client
    .from("flights")
    .select("pp, status, flown_at")
    .eq("user_id", user.id)
    .gte("flown_at", start)
    .lte("flown_at", end);

  if (error) {
    throw createError({ statusCode: 500, statusMessage: error.message });
  }

  return {
    year,
    ...summarizeYearFlights(data ?? [], todayISO()),
  };
});
