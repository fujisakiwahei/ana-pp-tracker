import Papa from "papaparse";
import { serverSupabaseClient } from "#supabase/server";
import type { Database } from "~~/shared/database.types";
import { requireUser } from "~~/server/utils/auth";
import { toFlightInsertRow, type FlightInsertRow } from "~~/server/utils/flightRow";
import { csvFlightInputSchema } from "~~/shared/schema";
import { PP_RESOLVE_ERROR_MESSAGE, resolvePP } from "~~/shared/pp";

interface RowError {
  row: number;
  issues: Array<{ path: (string | number)[]; message: string }>;
}

export default defineEventHandler(async (event) => {
  const user = await requireUser(event);
  const client = await serverSupabaseClient<Database>(event);

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
  const rows: FlightInsertRow[] = [];

  parsed.data.forEach((rawRow, i) => {
    const rowNum = i + 2; // header is row 1
    // 空文字 → undefined は schema 側 preprocess で吸収。
    // status の既定は csvFlightInputSchema 側で「搭乗確定」になる。
    const result = csvFlightInputSchema.safeParse({ ...rawRow });
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

    const pp = resolvePP(result.data);
    if (pp == null) {
      errors.push({
        row: rowNum,
        issues: [{ path: ["pp"], message: PP_RESOLVE_ERROR_MESSAGE }],
      });
      return;
    }

    rows.push(toFlightInsertRow(user.id, result.data, pp));
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
