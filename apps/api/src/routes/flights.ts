import { Hono } from "hono";
import Papa from "papaparse";
import { asFlightRow, asFlightRows } from "@ana/core/database.types";
import { toFlightColumns, toFlightInsertRow, type FlightInsertRow } from "@ana/core/flightRow";
import {
  csvFlightInputSchema,
  flightCreateInputSchema,
  flightInputSchema,
  type FlightInput,
  type ReturnFlightInput,
} from "@ana/core/schema";
import { getCurrentYear, PP_RESOLVE_ERROR_MESSAGE, resolvePP } from "@ana/core/pp";
import { ApiError, fromSupabaseError } from "../lib/errors";
import { rangeQuery, yearQuery } from "../lib/query";
import { jsonBody } from "../lib/validator";
import { requireUser } from "../middleware/auth";
import type { AppEnv } from "../types";

export const flights = new Hono<AppEnv>();

const SAMPLE_CSV = [
  "flown_at,flight_number,from_airport,to_airport,cabin,fare_type,pp,aircraft,seat,lounge,rating_seat,rating_aircraft,rating_lounge,notes",
  "2026-04-10,NH256,HND,FUK,economy,simple,,,,,,,,",
  "2026-04-12,NH257,FUK,HND,first,simple,,,,,,,,",
  "2026-05-20,NH985,HND,OKA,first,standard,,,,,,,,",
  "2026-05-22,NH984,OKA,HND,economy,simple,,,,,,,,",
  "",
].join("\n");

function buildInsertRow(userId: string, input: FlightInput): FlightInsertRow {
  const pp = resolvePP(input);
  if (pp == null) throw new ApiError(400, PP_RESOLVE_ERROR_MESSAGE);
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

// 静的パスは :id より先に登録する。
// Excel で開いたときに文字化けしないよう BOM を先頭に付ける。
flights.get("/sample-csv", (c) => {
  c.header("content-type", "text/csv; charset=utf-8");
  c.header("content-disposition", 'attachment; filename="ana-pp-sample.csv"');
  return c.body("\uFEFF" + SAMPLE_CSV);
});

interface RowError {
  row: number;
  issues: Array<{ path: (string | number)[]; message: string }>;
}

/**
 * CSV バルクインポート。
 *
 * Nuxt 版は h3 の readMultipartFormData() と Node の Buffer を使っていた。
 * Workers には Buffer が無いので、標準の FormData / File に置き換えてある。
 * papaparse は純 JS なのでそのまま動く。
 */
flights.post("/import", requireUser, async (c) => {
  const user = c.get("user");
  const db = c.get("db");

  const form = await c.req.formData().catch(() => null);
  // "file" を優先しつつ、別のフィールド名で送られてきた File も拾う。
  // Nuxt 版の `parts.find((p) => p.name === "file" || p.filename)` と同じ挙動。
  const named = form?.get("file");
  const file =
    named instanceof File
      ? named
      : [...(form?.values() ?? [])].find((v): v is File => v instanceof File);
  if (!file) {
    throw new ApiError(400, "CSVファイルが見つかりません");
  }

  const text = (await file.text()).replace(/^\uFEFF/, "");
  const parsed = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
  });

  if (parsed.errors.length > 0) {
    throw new ApiError(400, "CSV のパースに失敗しました", parsed.errors);
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
      errors.push({ row: rowNum, issues: [{ path: ["pp"], message: PP_RESOLVE_ERROR_MESSAGE }] });
      return;
    }

    rows.push(toFlightInsertRow(user.id, result.data, pp));
  });

  if (errors.length > 0) {
    return c.json({ ok: false as const, errors }, 400);
  }

  // ヘッダ行だけの CSV は空配列の insert になり、200 {inserted: 0} で
  // 成功したように見えてしまう。取り込む行が無いのは入力の誤りとして扱う。
  if (rows.length === 0) {
    throw new ApiError(400, "取り込める行がありません。CSV の中身を確認してください。");
  }

  const { error } = await db.from("flights").insert(rows);
  if (error) throw new ApiError(500, error.message);

  return c.json({ ok: true as const, inserted: rows.length });
});

flights.get("/", requireUser, async (c) => {
  const user = c.get("user");
  const db = c.get("db");

  const year = yearQuery(c.req.query("year"), getCurrentYear());
  const { limit, offset } = rangeQuery(c.req.query("limit"), c.req.query("offset"), 500, 1000);

  const { data, error, count } = await db
    .from("flights")
    .select("*", { count: "exact" })
    .eq("user_id", user.id)
    .gte("flown_at", `${year}-01-01`)
    .lte("flown_at", `${year}-12-31`)
    .order("flown_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw new ApiError(500, error.message);

  return c.json({ items: asFlightRows(data ?? []), total: count ?? 0, year });
});

flights.post("/", requireUser, jsonBody(flightCreateInputSchema), async (c) => {
  const user = c.get("user");
  const db = c.get("db");
  const input = c.req.valid("json");

  const outboundRow = buildInsertRow(user.id, input);

  if (!input.round_trip || !input.return_flight) {
    const { data, error } = await db.from("flights").insert(outboundRow).select().single();
    if (error) throw new ApiError(500, error.message);
    return c.json(asFlightRow(data));
  }

  const returnRow = buildInsertRow(user.id, buildReturnInput(input, input.return_flight));
  const { data, error } = await db.from("flights").insert([outboundRow, returnRow]).select();
  if (error) throw new ApiError(500, error.message);
  return c.json(asFlightRows(data ?? []));
});

flights.get("/:id", requireUser, async (c) => {
  const user = c.get("user");
  const db = c.get("db");

  const { data, error } = await db
    .from("flights")
    .select("*")
    .eq("id", c.req.param("id"))
    .eq("user_id", user.id)
    .single();

  if (error) throw fromSupabaseError(error);
  return c.json(asFlightRow(data));
});

flights.patch("/:id", requireUser, jsonBody(flightInputSchema), async (c) => {
  const user = c.get("user");
  const db = c.get("db");
  const input = c.req.valid("json");

  const pp = resolvePP(input);
  if (pp == null) throw new ApiError(400, PP_RESOLVE_ERROR_MESSAGE);

  const { data, error } = await db
    .from("flights")
    .update(toFlightColumns(input, pp))
    .eq("id", c.req.param("id"))
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) throw fromSupabaseError(error);
  return c.json(asFlightRow(data));
});

flights.delete("/:id", requireUser, async (c) => {
  const user = c.get("user");
  const db = c.get("db");

  const { error } = await db
    .from("flights")
    .delete()
    .eq("id", c.req.param("id"))
    .eq("user_id", user.id);

  if (error) throw new ApiError(500, error.message);
  return c.json({ ok: true as const });
});
