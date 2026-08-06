import { serverSupabaseClient } from "#supabase/server";
import { requireUser } from "~~/server/utils/auth";
import { toFlightInsertRow, type FlightInsertRow } from "~~/server/utils/flightRow";
import {
  flightCreateInputSchema,
  type FlightInput,
  type ReturnFlightInput,
} from "~~/shared/schema";
import { PP_RESOLVE_ERROR_MESSAGE, resolvePP } from "~~/shared/pp";

function buildInsertRow(userId: string, input: FlightInput): FlightInsertRow {
  const pp = resolvePP(input);
  if (pp == null) {
    throw createError({ statusCode: 400, statusMessage: PP_RESOLVE_ERROR_MESSAGE });
  }
  return toFlightInsertRow(userId, input, pp);
}

/** 復路は往路の区間を反転し、運賃種別とステータスは往路に合わせる。評価は復路側で独立。 */
function buildReturnInput(outbound: FlightInput, returnFlight: ReturnFlightInput): FlightInput {
  return {
    flown_at: returnFlight.flown_at,
    flight_number: returnFlight.flight_number,
    from_airport: outbound.to_airport,
    to_airport: outbound.from_airport,
    cabin: returnFlight.cabin ?? outbound.cabin,
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
  const client = await serverSupabaseClient(event);
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
  const outboundRow = buildInsertRow(user.id, input);

  if (!input.round_trip || !input.return_flight) {
    const { data, error } = await client.from("flights").insert(outboundRow).select().single();

    if (error) {
      throw createError({ statusCode: 500, statusMessage: error.message });
    }

    return data;
  }

  const returnRow = buildInsertRow(user.id, buildReturnInput(input, input.return_flight));

  const { data, error } = await client.from("flights").insert([outboundRow, returnRow]).select();

  if (error) {
    throw createError({ statusCode: 500, statusMessage: error.message });
  }

  return data;
});
