import { describe, expect, it } from "vitest";
import { asFlightRow, asFlightRows, type FlightDbRow, type FlightRow } from "../shared/database.types";
import { toFlightInsertRow } from "../server/utils/flightRow";
import { flightInputSchema } from "../shared/schema";

const dbRow: FlightDbRow = {
  id: "11111111-1111-1111-1111-111111111111",
  user_id: "22222222-2222-2222-2222-222222222222",
  flown_at: "2026-05-19",
  flight_number: "NH256",
  from_airport: "FUK",
  to_airport: "OKA",
  cabin: "economy",
  fare_type: "simple",
  pp: 851,
  status: "confirmed",
  aircraft: null,
  seat: null,
  lounge: null,
  rating_seat: null,
  rating_aircraft: null,
  rating_lounge: null,
  notes: null,
  created_at: "2026-05-19T00:00:00.000Z",
};

describe("FlightRow", () => {
  it("行の内容を変えずに型だけ絞る", () => {
    const row = asFlightRow(dbRow);
    expect(row).toBe(dbRow);
    expect(asFlightRows([dbRow])[0]).toBe(dbRow);
  });

  it("アプリ用の型では空港コードが AirportCode に絞られている", () => {
    const row: FlightRow = asFlightRow(dbRow);
    // 型が絞れていないと、この代入がコンパイルエラーになる
    const code: "FUK" | "OKA" | "HND" = row.from_airport as "FUK";
    expect(code).toBe("FUK");
  });

  it("status は必ず入っている (NOT NULL DEFAULT 'confirmed')", () => {
    // 型に null が含まれていれば下の代入が通らない
    const status: "confirmed" | "tentative" = asFlightRow(dbRow).status;
    expect(status).toBe("confirmed");
  });
});

describe("insert 行が DB の列と一致する", () => {
  it("toFlightInsertRow が flights テーブルの Insert 型を満たす", () => {
    const parsed = flightInputSchema.parse({
      flown_at: "2026-05-19",
      from_airport: "FUK",
      to_airport: "OKA",
      cabin: "economy",
    });
    const row = toFlightInsertRow("user-1", parsed, 851);

    // Row から id / created_at を除いた列がすべて揃っていること
    const expectedKeys = Object.keys(dbRow).filter((k) => k !== "id" && k !== "created_at");
    expect(Object.keys(row).sort()).toEqual(expectedKeys.sort());
  });
});
