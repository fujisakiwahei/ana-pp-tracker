import { Hono } from "hono";
import { getCurrentYear, todayISO } from "@ana/core/pp";
import { summarizeYearFlights } from "@ana/core/ppSummary";
import { ApiError } from "../lib/errors";
import { requireUser } from "../middleware/auth";
import { intQuery } from "../lib/query";
import type { AppEnv } from "../types";

export const stats = new Hono<AppEnv>();

stats.get("/summary", requireUser, async (c) => {
  const user = c.get("user");
  const db = c.get("db");

  const year = intQuery(c.req.query("year"), getCurrentYear());

  const { data, error } = await db
    .from("flights")
    .select("pp, status, flown_at")
    .eq("user_id", user.id)
    .gte("flown_at", `${year}-01-01`)
    .lte("flown_at", `${year}-12-31`);

  if (error) throw new ApiError(500, error.message);

  return c.json({ year, ...summarizeYearFlights(data ?? [], todayISO()) });
});
