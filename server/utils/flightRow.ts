import type { FlightInput } from "~~/shared/schema";

/**
 * FlightInput を flights テーブルの列に変換する。
 *
 * 以前は同じ15フィールドのマッピングが index.post.ts / [id].patch.ts /
 * import.post.ts の3箇所にコピペされていて、カラムを1つ足すたびに
 * 3箇所を直す必要があった。
 *
 * user_id は insert のときだけ必要なので、ここには含めない
 * (update では更新対象にしたくないため)。
 */
export function toFlightColumns(input: FlightInput, pp: number) {
  return {
    flown_at: input.flown_at,
    flight_number: input.flight_number ?? null,
    from_airport: input.from_airport,
    to_airport: input.to_airport,
    cabin: input.cabin,
    fare_type: input.fare_type ?? null,
    pp,
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

export type FlightColumns = ReturnType<typeof toFlightColumns>;

/** insert 用。所有者を明示する user_id が付く。 */
export type FlightInsertRow = FlightColumns & { user_id: string };

export function toFlightInsertRow(
  userId: string,
  input: FlightInput,
  pp: number,
): FlightInsertRow {
  return { user_id: userId, ...toFlightColumns(input, pp) };
}
