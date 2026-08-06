import { describe, expect, it } from "vitest";
import { csvFlightInputSchema, flightInputSchema, type FlightInput } from "../shared/schema";
import { PP_RESOLVE_ERROR_MESSAGE, resolvePP } from "../shared/pp";
import { toFlightColumns, toFlightInsertRow } from "../server/utils/flightRow";

const base = {
  flown_at: "2026-05-19",
  from_airport: "FUK",
  to_airport: "OKA",
  cabin: "economy",
  fare_type: "simple",
} as const;

const parse = (extra: Record<string, unknown> = {}): FlightInput => {
  const r = flightInputSchema.safeParse({ ...base, ...extra });
  if (!r.success) throw new Error(JSON.stringify(r.error.issues));
  return r.data;
};

describe("resolvePP", () => {
  it("手入力の上書きがあればそれを使う", () => {
    expect(resolvePP(parse({ pp: 1234 }))).toBe(1234);
  });

  it("上書きが無ければ路線テーブルから自動計算する", () => {
    // FUK-OKA economy simple (新運賃) = 851
    expect(resolvePP(parse())).toBe(851);
  });

  it("上書きが0でも0として尊重する", () => {
    expect(resolvePP(parse({ pp: 0 }))).toBe(0);
  });

  it("自動計算できない組み合わせは null", () => {
    // 旧運賃のセール運賃にプレミアムの設定は無い
    expect(
      resolvePP(parse({ cabin: "first", fare_type: "sale", flown_at: "2026-05-18" }))
    ).toBeNull();
  });

  it("エラー文言が1箇所に定義されている", () => {
    expect(PP_RESOLVE_ERROR_MESSAGE).toContain("PP の自動計算に失敗しました");
  });
});

describe("toFlightColumns", () => {
  it("未入力の任意項目は null に寄せる", () => {
    const cols = toFlightColumns(parse(), 851);
    expect(cols).toEqual({
      flown_at: "2026-05-19",
      flight_number: null,
      from_airport: "FUK",
      to_airport: "OKA",
      cabin: "economy",
      fare_type: "simple",
      pp: 851,
      status: "tentative",
      aircraft: null,
      seat: null,
      lounge: null,
      rating_seat: null,
      rating_aircraft: null,
      rating_lounge: null,
      notes: null,
    });
  });

  it("update で所有者を書き換えないよう user_id を含めない", () => {
    expect(toFlightColumns(parse(), 851)).not.toHaveProperty("user_id");
  });

  it("insert 用は user_id が付く", () => {
    const row = toFlightInsertRow("user-1", parse(), 851);
    expect(row.user_id).toBe("user-1");
    expect(row.pp).toBe(851);
  });

  it("入力値をそのまま反映する", () => {
    const cols = toFlightColumns(
      parse({ flight_number: "NH256", aircraft: "B787-9", seat: "1A", rating_seat: 5 }),
      900
    );
    expect(cols.flight_number).toBe("NH256");
    expect(cols.aircraft).toBe("B787-9");
    expect(cols.seat).toBe("1A");
    expect(cols.rating_seat).toBe(5);
    expect(cols.pp).toBe(900);
  });
});

describe("status の既定値", () => {
  it("フォームからの入力は未予約が既定", () => {
    expect(flightInputSchema.safeParse(base)).toMatchObject({
      success: true,
      data: { status: "tentative" },
    });
  });

  it("CSV取り込みは搭乗確定が既定 (過去実績の一括投入が前提)", () => {
    expect(csvFlightInputSchema.safeParse(base)).toMatchObject({
      success: true,
      data: { status: "confirmed" },
    });
  });

  it("CSVで明示された status は尊重する", () => {
    const r = csvFlightInputSchema.safeParse({ ...base, status: "tentative" });
    expect(r.success && r.data.status).toBe("tentative");
  });

  it("不正な status は既定値に落とさずエラーにする", () => {
    // 以前は生のCSV行を読んでいたため "foo" が confirmed に化けかねなかった
    expect(csvFlightInputSchema.safeParse({ ...base, status: "foo" }).success).toBe(false);
  });

  it("CSV用スキーマも出発地と到着地が同じなら弾く", () => {
    const r = csvFlightInputSchema.safeParse({ ...base, to_airport: "FUK" });
    expect(r.success).toBe(false);
    expect(r.success === false && r.error.issues[0]?.path).toEqual(["to_airport"]);
  });
});

