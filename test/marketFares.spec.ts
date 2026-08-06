import { describe, expect, it } from "vitest";
import { classifyByPrice, lookupMarket, yenPerPP } from "../shared/marketFares";

describe("lookupMarket", () => {
  it("from/to が逆でも同じ相場にマッチする", () => {
    expect(lookupMarket("OKA", "HND", "economy")).toEqual(lookupMarket("HND", "OKA", "economy"));
    expect(lookupMarket("HND", "OKA", "economy")).toEqual({ goodPrice: 14000, okPrice: 22000 });
  });

  it("クラスごとに別の相場を返す", () => {
    expect(lookupMarket("HND", "OKA", "first")).toEqual({ goodPrice: 33000, okPrice: 42000 });
  });

  it("プレミアム販売が薄い路線は first が null", () => {
    expect(lookupMarket("FUK", "ISG", "first")).toBeNull();
    expect(lookupMarket("FUK", "ISG", "economy")).not.toBeNull();
  });

  it("相場テーブルに無い路線は null", () => {
    expect(lookupMarket("SDJ", "HIJ", "economy")).toBeNull();
  });
});

describe("yenPerPP", () => {
  it("価格をPPで割る", () => {
    expect(yenPerPP(10000, 1000)).toBe(10);
  });

  it("PPが0/null なら null (0除算を防ぐ)", () => {
    expect(yenPerPP(10000, 0)).toBeNull();
    expect(yenPerPP(10000, null)).toBeNull();
    expect(yenPerPP(10000, -1)).toBeNull();
  });
});

describe("classifyByPrice", () => {
  it("good以下は good、ok超は high、その間は ok", () => {
    expect(classifyByPrice(10000, 14000, 22000)).toBe("good");
    expect(classifyByPrice(18000, 14000, 22000)).toBe("ok");
    expect(classifyByPrice(25000, 14000, 22000)).toBe("high");
  });

  it("境界値は good / ok 側に含む", () => {
    expect(classifyByPrice(14000, 14000, 22000)).toBe("good");
    expect(classifyByPrice(22000, 14000, 22000)).toBe("ok");
  });
});
