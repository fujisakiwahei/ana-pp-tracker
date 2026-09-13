import { beforeEach, describe, expect, it, vi } from "vitest";
import { GOAL_PP } from "@ana/core/pp";
import { AUTH_HEADER, createSupabaseStub, TEST_ENV, USER } from "./supabaseStub";

const mocked = vi.hoisted(() => ({ client: undefined as unknown }));
vi.mock("@supabase/supabase-js", () => ({ createClient: () => mocked.client }));

const app = (await import("../src/index")).default;

function useStub(opts: Parameters<typeof createSupabaseStub>[0] = {}) {
  const stub = createSupabaseStub({ user: USER, ...opts });
  mocked.client = stub.client;
  return stub;
}

beforeEach(() => {
  mocked.client = undefined;
});

describe("GET /stats/summary", () => {
  it("確定と未予約を分けて集計する", async () => {
    useStub({
      data: [
        { pp: 1000, status: "confirmed", flown_at: "2026-01-10" },
        { pp: 500, status: "tentative", flown_at: "2026-12-30" },
      ],
    });

    const res = await app.request("/stats/summary?year=2026", { headers: AUTH_HEADER }, TEST_ENV);
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({
      year: 2026,
      confirmedPP: 1000,
      tentativePP: 500,
      goalPP: GOAL_PP,
      flightsCount: 2,
    });
  });

  it("year を省略すると今年で引く", async () => {
    const stub = useStub({ data: [] });
    await app.request("/stats/summary", { headers: AUTH_HEADER }, TEST_ENV);
    expect(stub.argsOf("gte")).toContainEqual(["flown_at", `${new Date().getFullYear()}-01-01`]);
  });

  it("認証が無ければ 401", async () => {
    useStub({ user: null });
    const res = await app.request("/stats/summary", { headers: AUTH_HEADER }, TEST_ENV);
    expect(res.status).toBe(401);
  });
});
