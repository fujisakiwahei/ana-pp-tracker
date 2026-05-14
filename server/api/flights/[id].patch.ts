import { serverSupabaseServiceRole } from "#supabase/server";
import { requireUser } from "~~/server/utils/auth";
import { flightInputSchema } from "~~/shared/schema";
import { calcPP } from "~~/shared/pp";

export default defineEventHandler(async (event) => {
  const user = await requireUser(event);
  const client = serverSupabaseServiceRole(event);
  const id = getRouterParam(event, "id");
  if (!id) throw createError({ statusCode: 400, statusMessage: "Missing id" });

  const body = await readBody(event);
  const parsed = flightInputSchema.safeParse(body);
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: "Validation failed",
      data: { issues: parsed.error.issues },
    });
  }

  const input = parsed.data;
  let pp = input.pp;
  if (pp == null) {
    const auto = calcPP(
      input.from_airport,
      input.to_airport,
      input.cabin,
      input.fare_type,
      input.flown_at,
    );
    if (auto == null) {
      throw createError({
        statusCode: 400,
        statusMessage: "PP の自動計算に失敗しました。",
      });
    }
    pp = auto;
  }

  const updateRow = {
    flown_at: input.flown_at,
    flight_number: input.flight_number ?? null,
    from_airport: input.from_airport,
    to_airport: input.to_airport,
    cabin: input.cabin,
    fare_type: input.fare_type ?? null,
    pp,
    aircraft: input.aircraft ?? null,
    seat: input.seat ?? null,
    lounge: input.lounge ?? null,
    rating_seat: input.rating_seat ?? null,
    rating_aircraft: input.rating_aircraft ?? null,
    rating_lounge: input.rating_lounge ?? null,
    notes: input.notes ?? null,
  };

  const { data, error } = await client
    .from("flights")
    .update(updateRow)
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) {
    throw createError({ statusCode: 500, statusMessage: error.message });
  }
  return data;
});
