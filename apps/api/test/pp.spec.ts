import { describe, expect, it } from "vitest";
import { calcPPBreakdown } from "@ana/core/pp";
import app from "../src/index";
import type { ErrorBody } from "./json";
import { readJson } from "./json";
import { TEST_ENV } from "./supabaseStub";

const get = (qs: string) => app.request(`/pp/preview?${qs}`, {}, TEST_ENV);

describe("GET /pp/preview", () => {
  it("内訳を返す。iOS はこの値をそのまま表示するだけでよい", async () => {
    const res = await get("from=FUK&to=OKA&cabin=economy&fare_type=simple&flown_at=2026-06-01");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(
      calcPPBreakdown("FUK", "OKA", "economy", "simple", "2026-06-01")
    );
  });

  it("認証なしで叩ける。ユーザーのデータを含まないため", async () => {
    const res = await get("from=FUK&to=OKA&cabin=economy&flown_at=2026-06-01");
    expect(res.status).toBe(200);
  });

  it("搭乗日で新旧運賃が切り替わる", async () => {
    const before = await (
      await get("from=FUK&to=OKA&cabin=economy&fare_type=simple&flown_at=2026-05-18")
    ).json();
    const after = await (
      await get("from=FUK&to=OKA&cabin=economy&fare_type=simple&flown_at=2026-05-19")
    ).json();
    expect(before).toMatchObject({ rate: 75, boarding: 0, isNewEra: false });
    expect(after).toMatchObject({ rate: 70, boarding: 100, isNewEra: true });
  });

  it("路線がない組み合わせは 400 を返す", async () => {
    const res = await get("from=NRT&to=OKA&cabin=economy&fare_type=simple&flown_at=2026-06-01");
    expect(res.status).toBe(400);
    expect((await readJson<ErrorBody>(res)).error.message).toContain("PP の自動計算に失敗");
  });

  it("その運賃にそのクラスが無い組み合わせも 400", async () => {
    // sale × first は旧運賃には存在しない。
    const res = await get("from=FUK&to=OKA&cabin=first&fare_type=sale&flown_at=2026-05-18");
    expect(res.status).toBe(400);
  });

  it("必須パラメータが欠けていれば issues 付きで 400", async () => {
    const res = await get("from=FUK&cabin=economy&flown_at=2026-06-01");
    expect(res.status).toBe(400);
    const body = await readJson<ErrorBody>(res);
    expect(body.error.message).toBe("Validation failed");
    expect(body.error.issues).toBeTruthy();
  });
});
