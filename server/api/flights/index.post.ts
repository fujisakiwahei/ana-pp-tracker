import { serverSupabaseServiceRole } from "#supabase/server";
import { requireUser } from "~~/server/utils/auth";
import {
  flightCreateInputSchema,
  type FlightInput,
  type ReturnFlightInput,
} from "~~/shared/schema";
import { calcPP } from "~~/shared/pp";

async function resolvePP(input: FlightInput) {
  if (input.pp != null) return input.pp;

  const auto = calcPP(
    input.from_airport,
    input.to_airport,
    input.cabin,
    input.fare_type,
    input.flown_at
  );
  if (auto == null) {
    throw createError({
      statusCode: 400,
      statusMessage:
        "PP の自動計算に失敗しました。該当する路線・運賃の組み合わせがテーブルにないため、PP を手動で入力してください。",
    });
  }
  return auto;
}

async function buildInsertRow(userId: string, input: FlightInput) {
  return {
    user_id: userId,
    flown_at: input.flown_at,
    flight_number: input.flight_number ?? null,
    from_airport: input.from_airport,
    to_airport: input.to_airport,
    cabin: input.cabin,
    fare_type: input.fare_type ?? null,
    pp: await resolvePP(input),
    status: input.status,
    aircraft: input.aircraft ?? null,
    seat: input.seat ?? null,
    lounge: input.lounge ?? null,
    rating_seat: input.rating_seat ?? null,
    rating_aircraft: input.rating_aircraft ?? null,
    rating_lounge: input.rating_lounge ?? null,
    notes: input.notes ?? null,
  };
}

function buildReturnInput(outbound: FlightInput, returnFlight: ReturnFlightInput): FlightInput {
  return {
    flown_at: returnFlight.flown_at,
    flight_number: returnFlight.flight_number,
    from_airport: outbound.to_airport,
    to_airport: outbound.from_airport,
    cabin: outbound.cabin,
    fare_type: outbound.fare_type,
    status: outbound.status,
    pp: returnFlight.pp,
    aircraft: returnFlight.aircraft,
    seat: returnFlight.seat,
    lounge: returnFlight.lounge,
    rating_seat: undefined,
    rating_aircraft: undefined,
    rating_lounge: undefined,
    notes: returnFlight.notes,
  };
}

export default defineEventHandler(async (event) => {
  const user = await requireUser(event);
  const client = serverSupabaseServiceRole(event);
  const body = await readBody(event);

  const parsed = flightCreateInputSchema.safeParse(body);
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: "Validation failed",
      data: { issues: parsed.error.issues },
    });
  }

  const input = parsed.data;
  const outboundRow = await buildInsertRow(user.id, input);

  if (!input.round_trip || !input.return_flight) {
    const { data, error } = await client.from("flights").insert(outboundRow).select().single();

    if (error) {
      throw createError({ statusCode: 500, statusMessage: error.message });
    }

    return data;
  }

  const returnInput = buildReturnInput(input, input.return_flight);
  const rows = [outboundRow, await buildInsertRow(user.id, returnInput)];

  const { data, error } = await client.from("flights").insert(rows).select();

  if (error) {
    throw createError({ statusCode: 500, statusMessage: error.message });
  }

  return data;
});
