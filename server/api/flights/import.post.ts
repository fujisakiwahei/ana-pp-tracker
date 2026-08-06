import Papa from "papaparse";
import { serverSupabaseClient } from "#supabase/server";
import { requireUser } from "~~/server/utils/auth";
import { flightInputSchema } from "~~/shared/schema";
import { calcPP } from "~~/shared/pp";

interface RowError {
  row: number;
  issues: Array<{ path: (string | number)[]; message: string }>;
}

export default defineEventHandler(async (event) => {
  const user = await requireUser(event);
  const client = await serverSupabaseClient(event);

  const parts = await readMultipartFormData(event);
  const file = parts?.find((p) => p.name === "file" || p.filename);
  if (!file) {
    throw createError({ statusCode: 400, statusMessage: "CSVファイルが見つかりません" });
  }

  const text = file.data.toString("utf-8").replace(/^\uFEFF/, "");
  const parsed = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
  });

  if (parsed.errors.length > 0) {
    throw createError({
      statusCode: 400,
      statusMessage: "CSV のパースに失敗しました",
      data: { issues: parsed.errors },
    });
  }

  const errors: RowError[] = [];
  // FIXME(#6): 行マッピングを server/utils/ へ切り出すときに型を付ける。
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows: any[] = [];

  parsed.data.forEach((rawRow, i) => {
    const rowNum = i + 2; // header is row 1
    const normalized: Record<string, unknown> = { ...rawRow };
    // 空文字 → undefined は schema 側 preprocess で吸収
    const result = flightInputSchema.safeParse(normalized);
    if (!result.success) {
      errors.push({
        row: rowNum,
        issues: result.error.issues.map((iss) => ({
          path: iss.path as (string | number)[],
          message: iss.message,
        })),
      });
      return;
    }
    const input = result.data;
    let pp = input.pp;
    if (pp == null) {
      const auto = calcPP(
        input.from_airport,
        input.to_airport,
        input.cabin,
        input.fare_type,
        input.flown_at
      );
      if (auto == null) {
        errors.push({
          row: rowNum,
          issues: [
            {
              path: ["pp"],
              message: "PP の自動計算に失敗しました。手動で入力してください。",
            },
          ],
        });
        return;
      }
      pp = auto;
    }
    rows.push({
      user_id: user.id,
      flown_at: input.flown_at,
      flight_number: input.flight_number ?? null,
      from_airport: input.from_airport,
      to_airport: input.to_airport,
      cabin: input.cabin,
      fare_type: input.fare_type ?? null,
      pp,
      // CSV 取り込みは過去実績の一括投入が前提。明示で tentative 指定が無ければ確定扱い。
      status: rawRow.status === "tentative" ? "tentative" : "confirmed",
      aircraft: input.aircraft ?? null,
      seat: input.seat ?? null,
      lounge: input.lounge ?? null,
      rating_seat: input.rating_seat ?? null,
      rating_aircraft: input.rating_aircraft ?? null,
      rating_lounge: input.rating_lounge ?? null,
      notes: input.notes ?? null,
    });
  });

  if (errors.length > 0) {
    setResponseStatus(event, 400);
    return { ok: false, errors };
  }

  const { error } = await client.from("flights").insert(rows);
  if (error) {
    throw createError({ statusCode: 500, statusMessage: error.message });
  }
  return { ok: true, inserted: rows.length };
});
