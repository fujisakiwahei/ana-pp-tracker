import { describe, expect, it } from "vitest";
import {
  flightCreateInputSchema,
  flightInputSchema,
  returnFlightInputSchema,
} from "../shared/schema";

const base = {
  flown_at: "2026-05-19",
  from_airport: "HND",
  to_airport: "OKA",
  cabin: "economy",
};

describe("flightInputSchema", () => {
  it("最小構成を受け付け、status は tentative が既定になる", () => {
    const r = flightInputSchema.safeParse(base);
    expect(r.success).toBe(true);
    expect(r.success && r.data.status).toBe("tentative");
  });

  it("出発地と到着地が同じなら to_airport にエラーを付ける", () => {
    const r = flightInputSchema.safeParse({ ...base, to_airport: "HND" });
    expect(r.success).toBe(false);
    expect(r.success === false && r.error.issues[0]?.path).toEqual(["to_airport"]);
  });

  it("空文字は undefined に正規化される (CSV/フォームの空欄対策)", () => {
    const r = flightInputSchema.safeParse({
      ...base,
      flight_number: "",
      pp: "",
      aircraft: "",
      fare_type: "",
      rating_seat: "",
      notes: "",
    });
    expect(r.success).toBe(true);
    if (!r.success) return;
    expect(r.data.flight_number).toBeUndefined();
    expect(r.data.pp).toBeUndefined();
    expect(r.data.fare_type).toBeUndefined();
    expect(r.data.rating_seat).toBeUndefined();
  });

  it("pp は文字列でも数値に変換される", () => {
    const r = flightInputSchema.safeParse({ ...base, pp: "1234" });
    expect(r.success && r.data.pp).toBe(1234);
  });

  it("搭乗日は YYYY-MM-DD 形式のみ受け付ける", () => {
    expect(flightInputSchema.safeParse({ ...base, flown_at: "2026/05/19" }).success).toBe(false);
    expect(flightInputSchema.safeParse({ ...base, flown_at: "20260519" }).success).toBe(false);
  });

  it("範囲外の値を弾く", () => {
    expect(flightInputSchema.safeParse({ ...base, pp: 20001 }).success).toBe(false);
    expect(flightInputSchema.safeParse({ ...base, pp: -1 }).success).toBe(false);
    expect(flightInputSchema.safeParse({ ...base, rating_seat: 6 }).success).toBe(false);
    expect(flightInputSchema.safeParse({ ...base, rating_seat: 0 }).success).toBe(false);
    // flight_number は最大10文字
    expect(flightInputSchema.safeParse({ ...base, flight_number: "N".repeat(11) }).success).toBe(
      false
    );
  });

  it("未知の空港コード・クラス・運賃種別を弾く", () => {
    expect(flightInputSchema.safeParse({ ...base, from_airport: "XXX" }).success).toBe(false);
    expect(flightInputSchema.safeParse({ ...base, cabin: "business" }).success).toBe(false);
    expect(flightInputSchema.safeParse({ ...base, fare_type: "unknown" }).success).toBe(false);
  });

  it("路線テーブルに登録済みの空港はすべて受け付ける", () => {
    // 空港マスタと Zod enum のズレを検知する (過去に WKJ/KUH/SHB で発生)
    for (const code of ["WKJ", "KUH", "SHB", "MMY", "ISG", "OIT"]) {
      const r = flightInputSchema.safeParse({ ...base, from_airport: code });
      expect(r.success, `${code} が airportCodeSchema にありません`).toBe(true);
    }
  });
});

describe("returnFlightInputSchema", () => {
  it("帰りの搭乗日が必須", () => {
    expect(returnFlightInputSchema.safeParse({}).success).toBe(false);
    expect(returnFlightInputSchema.safeParse({ flown_at: "2026-05-22" }).success).toBe(true);
  });

  it("クラスは任意 (未指定なら往路に合わせる想定)", () => {
    const r = returnFlightInputSchema.safeParse({ flown_at: "2026-05-22" });
    expect(r.success && r.data.cabin).toBeUndefined();
  });
});

describe("flightCreateInputSchema", () => {
  it("往復フラグ無しなら復路情報は不要", () => {
    expect(flightCreateInputSchema.safeParse(base).success).toBe(true);
  });

  it("往復フラグありで復路情報が無ければエラー", () => {
    const r = flightCreateInputSchema.safeParse({ ...base, round_trip: true });
    expect(r.success).toBe(false);
    expect(r.success === false && r.error.issues[0]?.path).toEqual(["return_flight"]);
  });

  it("往復フラグありで復路情報があれば通る", () => {
    const r = flightCreateInputSchema.safeParse({
      ...base,
      round_trip: true,
      return_flight: { flown_at: "2026-05-22", cabin: "first" },
    });
    expect(r.success).toBe(true);
  });
});
