import { serverSupabaseClient } from "#supabase/server";
import { requireUser } from "~~/server/utils/auth";
import { getCurrentYear } from "~~/shared/pp";
import type { FlightRow } from "~~/shared/schema";

export default defineEventHandler(async (event) => {
  await requireUser(event);
  const client = await serverSupabaseClient(event);

  const query = getQuery(event);
  const year = Number(query.year ?? getCurrentYear());
  const limit = Math.min(Number(query.limit ?? 500), 1000);
  const offset = Number(query.offset ?? 0);

  const start = `${year}-01-01`;
  const end = `${year}-12-31`;

  const { data, error, count } = await client
    .from("flights")
    .select("*", { count: "exact" })
    .gte("flown_at", start)
    .lte("flown_at", end)
    .order("flown_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    throw createError({ statusCode: 500, statusMessage: error.message });
  }

  return {
    items: (data ?? []) as FlightRow[],
    total: count ?? 0,
    year,
  };
});
