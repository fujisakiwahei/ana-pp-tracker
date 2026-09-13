import { afterEach, describe, expect, it, vi } from "vitest";
import { getCurrentYear, todayISO } from "../src/pp";

/**
 * 「今日」「今年」は日本時間で決まる必要がある。
 * API は Cloudflare Workers (常に UTC) で動くので、実装が実行環境の
 * タイムゾーンに依存していると日本のユーザーに対して 9 時間ずれる。
 */
afterEach(() => {
  vi.useRealTimers();
});

function at(iso: string) {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(iso));
}

describe("todayISO", () => {
  it("YYYY-MM-DD を返す", () => {
    at("2026-06-15T03:00:00Z");
    expect(todayISO()).toBe("2026-06-15");
  });

  it("UTC で前日でも、日本時間で当日ならその日を返す", () => {
    // 2026-05-31 20:00 UTC = 2026-06-01 05:00 JST
    at("2026-05-31T20:00:00Z");
    expect(todayISO()).toBe("2026-06-01");
  });

  it("日本時間の 0 時をまたぐまでは日付が変わらない", () => {
    // 2026-05-31 14:59 UTC = 2026-05-31 23:59 JST
    at("2026-05-31T14:59:00Z");
    expect(todayISO()).toBe("2026-05-31");
  });

  it("搭乗済の判定が朝の 9 時間だけ遅れることがない", () => {
    // 2026-06-01 00:30 JST。当日の便は「今日まで」に含まれてほしい。
    at("2026-05-31T15:30:00Z");
    expect("2026-06-01" <= todayISO()).toBe(true);
  });
});

describe("getCurrentYear", () => {
  it("日本時間で年が明けていれば新しい年を返す", () => {
    // 2025-12-31 16:00 UTC = 2026-01-01 01:00 JST
    at("2025-12-31T16:00:00Z");
    expect(getCurrentYear()).toBe(2026);
  });

  it("日本時間で年内なら前年のまま", () => {
    // 2025-12-31 14:00 UTC = 2025-12-31 23:00 JST
    at("2025-12-31T14:00:00Z");
    expect(getCurrentYear()).toBe(2025);
  });

  it("todayISO と年が食い違わない", () => {
    at("2025-12-31T16:00:00Z");
    expect(String(getCurrentYear())).toBe(todayISO().slice(0, 4));
  });
});
