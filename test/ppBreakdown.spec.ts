import { describe, expect, it } from "vitest";
import { calcPP, calcPPBreakdown, DOMESTIC_ROUTE_MULTIPLIER } from "../shared/pp";
import { ROUTES, type CabinClass, type FareType } from "../shared/routes";

const OLD_ERA = "2026-05-18";
const NEW_ERA = "2026-05-19";

describe("calcPPBreakdown", () => {
  it("運賃表どおりの積算率・搭乗ポイントを返す", () => {
    // 新運賃 シンプル economy = 70% / +100
    expect(calcPPBreakdown("FUK", "OKA", "economy", "simple", NEW_ERA)).toEqual({
      baseMiles: 537,
      rate: 70,
      multiplier: 2,
      accrued: 751, // floor(537 × 0.70 × 2) = floor(751.8)
      boarding: 100,
      total: 851,
      isNewEra: true,
    });
  });

  it("旧運賃では旧テーブルの値を返す", () => {
    // 旧運賃 シンプル economy = 75% / +0
    expect(calcPPBreakdown("FUK", "OKA", "economy", "simple", OLD_ERA)).toEqual({
      baseMiles: 537,
      rate: 75,
      multiplier: 2,
      accrued: 805, // floor(537 × 0.75 × 2) = floor(805.5)
      boarding: 0,
      total: 805,
      isNewEra: false,
    });
  });

  it("路線・運賃が無ければ null", () => {
    expect(calcPPBreakdown("SDJ", "HIJ", "economy", "simple", NEW_ERA)).toBeNull();
    expect(calcPPBreakdown("HND", "OKA", "first", "sale", OLD_ERA)).toBeNull();
  });

  it("内訳の合計が total と一致する", () => {
    const b = calcPPBreakdown("HND", "OKA", "first", "standard", NEW_ERA)!;
    expect(b.accrued + b.boarding).toBe(b.total);
    expect(b.accrued).toBe(Math.floor(b.baseMiles * (b.rate / 100) * b.multiplier));
    expect(b.multiplier).toBe(DOMESTIC_ROUTE_MULTIPLIER);
  });

  it("calcPP は calcPPBreakdown の total と常に一致する", () => {
    for (const r of ROUTES) {
      for (const cabin of ["economy", "first"] as CabinClass[]) {
        for (const fare of ["simple", "standard", "flex", "sale"] as FareType[]) {
          for (const date of [OLD_ERA, NEW_ERA]) {
            expect(calcPP(r.from, r.to, cabin, fare, date)).toBe(
              calcPPBreakdown(r.from, r.to, cabin, fare, date)?.total ?? null
            );
          }
        }
      }
    }
  });
});

describe("旧UIの逆算ロジックとの比較", () => {
  // FlightForm.vue にあった「合計PPから積算率と搭乗ポイントを逆算する」実装。
  // accrued + boarding = total は解が一意に定まらず、候補を上から舐めて
  // 最初に条件を満たしたものを返すため、実際には誤った内訳を表示していた。
  function reverseEngineered(miles: number, total: number | null) {
    if (!miles || total == null) return null;
    for (const bonus of [0, 100, 200, 400]) {
      const accrued = total - bonus;
      if (accrued < 0) continue;
      const ratePct = (accrued / (miles * 2)) * 100;
      const rounded = Math.round(ratePct);
      if (Math.abs(rounded - ratePct) < 0.6 && rounded >= 30 && rounded <= 150) {
        return { rate: rounded, boarding: bonus };
      }
    }
    return null;
  }

  it("逆算では誤答になるケースで、内訳は正しい値を返す", () => {
    // FUK-OKA エコノミー シンプル (新運賃) = 851 PP
    // 逆算: bonus=0 で 851/1074*100 = 79.24% が許容誤差に入ってしまい 79%/+0 を返す
    // 正解: 70% / +100
    const b = calcPPBreakdown("FUK", "OKA", "economy", "simple", NEW_ERA)!;
    const old = reverseEngineered(537, b.total)!;

    expect(old).toEqual({ rate: 79, boarding: 0 }); // 旧実装の誤答
    expect({ rate: b.rate, boarding: b.boarding }).toEqual({ rate: 70, boarding: 100 });
  });

  it("逆算が誤答する組み合わせが多数あったことを記録する", () => {
    const TRUE_NEW: Record<string, Record<CabinClass, { rate: number; boarding: number }>> = {
      simple: { economy: { rate: 70, boarding: 100 }, first: { rate: 120, boarding: 400 } },
      standard: { economy: { rate: 80, boarding: 200 }, first: { rate: 130, boarding: 400 } },
      flex: { economy: { rate: 100, boarding: 400 }, first: { rate: 150, boarding: 400 } },
      sale: { economy: { rate: 50, boarding: 0 }, first: { rate: 100, boarding: 0 } },
    };

    let checked = 0;
    let oldWrong = 0;
    for (const r of ROUTES) {
      for (const fare of Object.keys(TRUE_NEW) as FareType[]) {
        for (const cabin of ["economy", "first"] as CabinClass[]) {
          const b = calcPPBreakdown(r.from, r.to, cabin, fare, NEW_ERA);
          if (!b) continue;
          checked++;

          // 新実装は常に運賃表と一致する
          const truth = TRUE_NEW[fare]![cabin]!;
          expect({ rate: b.rate, boarding: b.boarding }).toEqual(truth);

          const old = reverseEngineered(r.baseMiles, b.total);
          if (!old || old.rate !== truth.rate || old.boarding !== truth.boarding) oldWrong++;
        }
      }
    }

    expect(checked).toBe(328);
    expect(oldWrong).toBe(177); // 全体の54%が誤表示だった
  });
});
