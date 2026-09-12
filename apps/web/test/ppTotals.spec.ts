import { describe, expect, it } from "vitest";
import { resolvePPTotals } from "../app/utils/ppTotals";

describe("resolvePPTotals", () => {
  it("片道は往路の自動計算値をそのまま使う", () => {
    expect(resolvePPTotals({ outboundAuto: 851, isRoundTrip: false })).toEqual({
      outbound: 851,
      inbound: 0,
      added: 851,
    });
  });

  it("往路の手入力があれば自動計算値より優先する", () => {
    expect(
      resolvePPTotals({ outboundAuto: 851, outboundOverride: 900, isRoundTrip: false })
    ).toEqual({ outbound: 900, inbound: 0, added: 900 });
  });

  it("往復なら復路ぶんを加算する", () => {
    expect(
      resolvePPTotals({ outboundAuto: 851, isRoundTrip: true, inboundPP: 851 })
    ).toEqual({ outbound: 851, inbound: 851, added: 1702 });
  });

  it("往復でも往路の手入力上書きが合計に反映される", () => {
    // 旧実装ではサイドバーの大きい数字 (ppDisplay) だけ上書きを見ておらず、
    // 「今回加算されるPP」と「記録した後の累計」がズレていた。
    const t = resolvePPTotals({
      outboundAuto: 851,
      outboundOverride: 1000,
      isRoundTrip: true,
      inboundPP: 851,
    });
    expect(t).toEqual({ outbound: 1000, inbound: 851, added: 1851 });
    expect(t.outbound + t.inbound).toBe(t.added);
  });

  it("往復OFFなら復路PPが入っていても加算しない", () => {
    expect(
      resolvePPTotals({ outboundAuto: 851, isRoundTrip: false, inboundPP: 999 })
    ).toEqual({ outbound: 851, inbound: 0, added: 851 });
  });

  it("計算できない場合は0として扱う", () => {
    expect(resolvePPTotals({ outboundAuto: null, isRoundTrip: false })).toEqual({
      outbound: 0,
      inbound: 0,
      added: 0,
    });
    expect(
      resolvePPTotals({ outboundAuto: null, isRoundTrip: true, inboundPP: null })
    ).toEqual({ outbound: 0, inbound: 0, added: 0 });
  });

  it("上書きに0が入っていれば0として扱う (?? なので false 判定に落ちない)", () => {
    expect(
      resolvePPTotals({ outboundAuto: 851, outboundOverride: 0, isRoundTrip: false })
    ).toEqual({ outbound: 0, inbound: 0, added: 0 });
  });
});
