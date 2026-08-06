import { describe, expect, it } from "vitest";
import { AIRPORTS, AIRPORT_CODES } from "../shared/airports";
import {
  CABIN_CLASSES,
  FARE_TYPES,
  FARE_TYPE_LABELS,
  ROUTES,
  SELECTABLE_AIRPORT_CODES,
} from "../shared/routes";
import {
  airportCodeSchema,
  cabinClassSchema,
  fareTypeSchema,
  flightInputSchema,
} from "../shared/schema";
import { calcPP } from "../shared/pp";

// 空港・クラス・運賃の定義がファイル間でズレていないことを保証する。
// 以前は同じ一覧が3ファイルに手書きされており、schema.ts の更新漏れで
// 「フォームには出るが保存できない空港」が生まれていた (f3b3d57)。

describe("定義の一元化", () => {
  it("Zod の airportCodeSchema が空港マスタと完全に一致する", () => {
    expect([...airportCodeSchema.options].sort()).toEqual([...AIRPORT_CODES].sort());
  });

  it("Zod の cabinClassSchema / fareTypeSchema が値リストと一致する", () => {
    expect([...cabinClassSchema.options].sort()).toEqual([...CABIN_CLASSES].sort());
    expect([...fareTypeSchema.options].sort()).toEqual([...FARE_TYPES].sort());
  });

  it("AIRPORT_CODES が空港マスタのキーと一致する", () => {
    expect(AIRPORT_CODES).toEqual(Object.keys(AIRPORTS));
  });

  it("すべての運賃種別に表示名がある", () => {
    for (const fare of FARE_TYPES) {
      expect(FARE_TYPE_LABELS[fare], `${fare} のラベルがありません`).toBeTruthy();
    }
    expect(Object.keys(FARE_TYPE_LABELS).sort()).toEqual([...FARE_TYPES].sort());
  });

  it("路線テーブルの空港がすべて空港マスタに載っている", () => {
    for (const r of ROUTES) {
      expect(AIRPORTS[r.from], `${r.from} が空港マスタにありません`).toBeDefined();
      expect(AIRPORTS[r.to], `${r.to} が空港マスタにありません`).toBeDefined();
    }
  });
});

describe("SELECTABLE_AIRPORT_CODES", () => {
  it("選択肢に出る空港は必ず PP を計算できる (= 保存できる)", () => {
    // 「選べるのに保存すると400になる」状態を作らないための保証。
    for (const code of SELECTABLE_AIRPORT_CODES) {
      const partner = SELECTABLE_AIRPORT_CODES.find(
        (other) => other !== code && calcPP(code, other, "economy", "simple", "2026-05-19") != null
      );
      expect(partner, `${code} は ROUTES に路線が無く、保存できません`).toBeDefined();
    }
  });

  it("路線データの無い空港は選択肢に出ない", () => {
    // NRT は空港マスタにあるが ROUTES に路線が1件も無い。
    expect(AIRPORTS.NRT).toBeDefined();
    expect(ROUTES.some((r) => r.from === "NRT" || r.to === "NRT")).toBe(false);
    expect(SELECTABLE_AIRPORT_CODES).not.toContain("NRT");
  });

  it("既存データを壊さないよう、選択肢外の空港もバリデーションは通す", () => {
    // 過去に NRT で登録されたレコードの編集・取得が 400 にならないこと。
    const r = flightInputSchema.safeParse({
      flown_at: "2026-05-19",
      from_airport: "NRT",
      to_airport: "OKA",
      cabin: "economy",
      pp: 1000,
    });
    expect(r.success).toBe(true);
  });

  it("空港マスタの並び順を保っている", () => {
    const masterOrder = AIRPORT_CODES.filter((c) => SELECTABLE_AIRPORT_CODES.includes(c));
    expect(SELECTABLE_AIRPORT_CODES).toEqual(masterOrder);
  });
});
