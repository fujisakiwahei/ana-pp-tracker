import { describe, expect, it } from "vitest";
import {
  calcPP,
  findRoute,
  FARE_CHANGE_DATE,
  getSuggestions,
  isNewFareEra,
  roundTripsNeeded,
} from "../shared/pp";

// 旧運賃 = 〜2026-05-18 搭乗 / 新運賃 = 2026-05-19 搭乗〜
const OLD_ERA = "2026-05-18";
const NEW_ERA = "2026-05-19";

describe("isNewFareEra", () => {
  it("切替日当日から新運賃になる", () => {
    expect(isNewFareEra(OLD_ERA)).toBe(false);
    expect(isNewFareEra(NEW_ERA)).toBe(true);
    expect(isNewFareEra(FARE_CHANGE_DATE)).toBe(true);
  });

  it("切替日から離れた日付でも判定できる", () => {
    expect(isNewFareEra("2025-01-01")).toBe(false);
    expect(isNewFareEra("2027-12-31")).toBe(true);
  });
});

describe("findRoute", () => {
  it("from/to が逆でも同じ路線にマッチする", () => {
    expect(findRoute("FUK", "OKA")).toEqual(findRoute("OKA", "FUK"));
    expect(findRoute("FUK", "OKA")?.baseMiles).toBe(537);
  });

  it("路線テーブルに無い組み合わせは undefined", () => {
    expect(findRoute("SDJ", "HIJ")).toBeUndefined();
  });
});

describe("calcPP", () => {
  it("端数を切り捨てる (FUK-OKA 537mi × 75% × 2 = 805.5 → 805)", () => {
    expect(calcPP("FUK", "OKA", "economy", "simple", OLD_ERA)).toBe(805);
  });

  it("運賃改定の境界で結果が変わる", () => {
    // 旧: 75% / +0 → floor(537 × 0.75 × 2) = 805
    expect(calcPP("FUK", "OKA", "economy", "simple", OLD_ERA)).toBe(805);
    // 新: 70% / +100 → floor(537 × 0.70 × 2) + 100 = 751 + 100 = 851
    expect(calcPP("FUK", "OKA", "economy", "simple", NEW_ERA)).toBe(851);
  });

  it("区間を逆にしても同じ値になる", () => {
    expect(calcPP("OKA", "FUK", "economy", "simple", NEW_ERA)).toBe(
      calcPP("FUK", "OKA", "economy", "simple", NEW_ERA)
    );
  });

  it("プレミアム(first)の積算率が使われる", () => {
    // 新 simple first: 120% / +400 → floor(984 × 1.2 × 2) + 400 = 2361 + 400 = 2761
    expect(calcPP("HND", "OKA", "first", "simple", NEW_ERA)).toBe(2761);
    // 旧 simple first: 125% / +400 → floor(984 × 1.25 × 2) + 400 = 2460 + 400 = 2860
    expect(calcPP("HND", "OKA", "first", "simple", OLD_ERA)).toBe(2860);
  });

  it("プレミアム設定の無い運賃は null を返す", () => {
    // 旧運賃のセール運賃には first の設定が無い
    expect(calcPP("HND", "OKA", "first", "sale", OLD_ERA)).toBeNull();
    // 新運賃では first が追加されているので計算できる
    expect(calcPP("HND", "OKA", "first", "sale", NEW_ERA)).toBe(1968);
    // 島民割引は新旧どちらも first 無し
    expect(calcPP("HND", "OKA", "first", "shimin", OLD_ERA)).toBeNull();
    expect(calcPP("HND", "OKA", "first", "shimin", NEW_ERA)).toBeNull();
  });

  it("fare_type 未指定ならフォールバックの積算率を使う", () => {
    // 旧フォールバック economy: 100% / +400 → 567 × 1.0 × 2 + 400 = 1534
    expect(calcPP("HND", "FUK", "economy", undefined, OLD_ERA)).toBe(1534);
    // 新フォールバック economy: 80% / +200 → floor(567 × 0.8 × 2) + 200 = 907 + 200 = 1107
    expect(calcPP("HND", "FUK", "economy", undefined, NEW_ERA)).toBe(1107);
    // 新フォールバック first: 130% / +400 → floor(567 × 1.3 × 2) + 400 = 1474 + 400 = 1874
    expect(calcPP("HND", "FUK", "first", undefined, NEW_ERA)).toBe(1874);
  });

  it("路線テーブルに無い組み合わせは null を返す", () => {
    expect(calcPP("SDJ", "HIJ", "economy", "simple", NEW_ERA)).toBeNull();
  });
});

describe("roundTripsNeeded", () => {
  it("残PPを1往復あたりPPで割り上げる", () => {
    expect(roundTripsNeeded(2000, 1000)).toBe(2);
    expect(roundTripsNeeded(2500, 1000)).toBe(3);
  });

  it("残PPが0以下なら0往復", () => {
    expect(roundTripsNeeded(0, 1000)).toBe(0);
    expect(roundTripsNeeded(-5, 1000)).toBe(0);
  });

  it("1往復あたりPPが0以下なら Infinity (0除算を防ぐ)", () => {
    expect(roundTripsNeeded(1000, 0)).toBe(Infinity);
    expect(roundTripsNeeded(1000, -1)).toBe(Infinity);
  });
});

describe("getSuggestions", () => {
  it("候補路線ぶんの提案を往復PP付きで返す", () => {
    const list = getSuggestions(10000, "economy", "simple", NEW_ERA);
    expect(list).toHaveLength(4);
    const fukOka = list.find((s) => s.from === "FUK" && s.to === "OKA");
    // 片道851 × 2
    expect(fukOka?.ppRoundTrip).toBe(1702);
    expect(fukOka?.roundTripsNeeded).toBe(Math.ceil(10000 / 1702));
  });

  it("残PPが負でも0として扱う", () => {
    const list = getSuggestions(-100, "economy", "simple", NEW_ERA);
    expect(list.every((s) => s.roundTripsNeeded === 0)).toBe(true);
  });
});
