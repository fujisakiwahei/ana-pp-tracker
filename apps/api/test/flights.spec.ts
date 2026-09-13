import { beforeEach, describe, expect, it, vi } from "vitest";
import { calcPP } from "@ana/core/pp";
import type { ErrorBody } from "./json";
import { readJson } from "./json";
import { AUTH_HEADER, createSupabaseStub, TEST_ENV, USER } from "./supabaseStub";

const mocked = vi.hoisted(() => ({ client: undefined as unknown }));
vi.mock("@supabase/supabase-js", () => ({ createClient: () => mocked.client }));

const app = (await import("../src/index")).default;

type Stub = ReturnType<typeof createSupabaseStub>;

function useStub(opts: Parameters<typeof createSupabaseStub>[0] = {}): Stub {
  const stub = createSupabaseStub({ user: USER, ...opts });
  mocked.client = stub.client;
  return stub;
}

const json = (method: string, path: string, body: unknown) =>
  app.request(
    path,
    {
      method,
      headers: { ...AUTH_HEADER, "content-type": "application/json" },
      body: JSON.stringify(body),
    },
    TEST_ENV
  );

const VALID_FLIGHT = {
  flown_at: "2026-06-01",
  from_airport: "FUK",
  to_airport: "OKA",
  cabin: "economy",
  fare_type: "simple",
  status: "confirmed",
};

const ROW = {
  ...VALID_FLIGHT,
  id: "f1",
  user_id: USER.id,
  pp: 805,
  created_at: "2026-06-01T00:00:00Z",
};

beforeEach(() => {
  mocked.client = undefined;
});

describe("認証", () => {
  it("Authorization ヘッダが無ければ 401", async () => {
    useStub();
    const res = await app.request("/flights", {}, TEST_ENV);
    expect(res.status).toBe(401);
    expect((await readJson<ErrorBody>(res)).error.message).toBe("Unauthorized");
  });

  it("Bearer 以外のスキームは受け付けない", async () => {
    useStub();
    const res = await app.request(
      "/flights",
      { headers: { Authorization: "Basic xxx" } },
      TEST_ENV
    );
    expect(res.status).toBe(401);
  });

  it("トークンが Supabase に拒否されたら 401", async () => {
    useStub({ user: null });
    const res = await app.request("/flights", { headers: AUTH_HEADER }, TEST_ENV);
    expect(res.status).toBe(401);
  });
});

describe("GET /flights", () => {
  it("年で絞り込み、user_id も明示して引く", async () => {
    const stub = useStub({ data: [ROW], count: 1 });
    const res = await app.request("/flights?year=2026", { headers: AUTH_HEADER }, TEST_ENV);

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ items: [ROW], total: 1, year: 2026 });
    expect(stub.argsOf("eq")).toContainEqual(["user_id", USER.id]);
    expect(stub.argsOf("gte")).toContainEqual(["flown_at", "2026-01-01"]);
    expect(stub.argsOf("lte")).toContainEqual(["flown_at", "2026-12-31"]);
  });

  it("limit は 1000 で頭打ちにする", async () => {
    const stub = useStub({ data: [] });
    await app.request("/flights?limit=99999", { headers: AUTH_HEADER }, TEST_ENV);
    expect(stub.argsOf("range")).toContainEqual([0, 999]);
  });

  it("数値でない year は今年に倒す (NaN-01-01 を投げ込まない)", async () => {
    const stub = useStub({ data: [] });
    await app.request("/flights?year=abc", { headers: AUTH_HEADER }, TEST_ENV);
    const [[, start]] = stub.argsOf("gte");
    expect(start).toBe(`${new Date().getFullYear()}-01-01`);
  });

  it("limit と offset が負でも range を反転させない", async () => {
    const stub = useStub({ data: [] });
    await app.request("/flights?limit=-5&offset=-3", { headers: AUTH_HEADER }, TEST_ENV);
    // 反転した range を渡すと PostgREST に弾かれ、入力ミスが 500 になる。
    const [[start, end]] = stub.argsOf("range") as [[number, number]];
    expect(start).toBeGreaterThanOrEqual(0);
    expect(end).toBeGreaterThanOrEqual(start);
  });

  it("limit=0 でも 1 件は引く", async () => {
    const stub = useStub({ data: [] });
    await app.request("/flights?limit=0", { headers: AUTH_HEADER }, TEST_ENV);
    expect(stub.argsOf("range")).toContainEqual([0, 0]);
  });

  it("指数表記の year も今年に倒す (1e+21-01-01 を投げない)", async () => {
    const stub = useStub({ data: [] });
    await app.request("/flights?year=1e21", { headers: AUTH_HEADER }, TEST_ENV);
    const [[, start]] = stub.argsOf("gte");
    expect(start).toBe(`${new Date().getFullYear()}-01-01`);
  });

  it("範囲外の year も今年に倒す", async () => {
    const stub = useStub({ data: [] });
    await app.request("/flights?year=99999", { headers: AUTH_HEADER }, TEST_ENV);
    const [[, start]] = stub.argsOf("gte");
    expect(start).toBe(`${new Date().getFullYear()}-01-01`);
  });

  it("DB エラーは 500 にして生のメッセージを返す", async () => {
    useStub({ error: { message: "boom" } });
    const res = await app.request("/flights", { headers: AUTH_HEADER }, TEST_ENV);
    expect(res.status).toBe(500);
    expect((await readJson<ErrorBody>(res)).error.message).toBe("boom");
  });
});

describe("POST /flights", () => {
  it("検証に落ちたら issues 付きで 400", async () => {
    useStub();
    const res = await json("POST", "/flights", { ...VALID_FLIGHT, from_airport: "XXX" });
    expect(res.status).toBe(400);
    const body = await readJson<ErrorBody>(res);
    expect(body.error.message).toBe("Validation failed");
    expect(Array.isArray(body.error.issues)).toBe(true);
  });

  it("出発地と到着地が同じなら 400", async () => {
    useStub();
    const res = await json("POST", "/flights", { ...VALID_FLIGHT, to_airport: "FUK" });
    expect(res.status).toBe(400);
  });

  it("PP を自動計算して1行 insert する", async () => {
    const stub = useStub({ data: ROW });
    const res = await json("POST", "/flights", VALID_FLIGHT);

    expect(res.status).toBe(200);
    const [[inserted]] = stub.argsOf("insert");
    expect(inserted).toMatchObject({
      user_id: USER.id,
      from_airport: "FUK",
      to_airport: "OKA",
      pp: calcPP("FUK", "OKA", "economy", "simple", "2026-06-01"),
    });
  });

  it("pp の手入力があれば自動計算より優先する", async () => {
    const stub = useStub({ data: ROW });
    await json("POST", "/flights", { ...VALID_FLIGHT, pp: 1234 });
    const [[inserted]] = stub.argsOf("insert");
    expect(inserted).toMatchObject({ pp: 1234 });
  });

  it("往復は2行 insert し、復路は区間を反転して運賃とステータスを引き継ぐ", async () => {
    const stub = useStub({ data: [ROW, ROW] });
    const res = await json("POST", "/flights", {
      ...VALID_FLIGHT,
      round_trip: true,
      return_flight: { flown_at: "2026-06-03", flight_number: "NH1234" },
    });

    expect(res.status).toBe(200);
    const [[inserted]] = stub.argsOf("insert");
    const rows = inserted as Array<Record<string, unknown>>;
    expect(rows).toHaveLength(2);
    expect(rows[1]).toMatchObject({
      from_airport: "OKA",
      to_airport: "FUK",
      flown_at: "2026-06-03",
      flight_number: "NH1234",
      fare_type: "simple",
      status: "confirmed",
    });
  });

  it("round_trip なのに復路が無ければ 400", async () => {
    useStub();
    const res = await json("POST", "/flights", { ...VALID_FLIGHT, round_trip: true });
    expect(res.status).toBe(400);
  });

  it("路線テーブルに無い区間は 400 で手入力を促す", async () => {
    useStub();
    const res = await json("POST", "/flights", { ...VALID_FLIGHT, from_airport: "NRT" });
    expect(res.status).toBe(400);
    expect((await readJson<ErrorBody>(res)).error.message).toContain("PP を手動で入力");
  });
});

describe("GET/PATCH/DELETE /flights/:id", () => {
  it("見つからなければ 404", async () => {
    useStub({ error: { code: "PGRST116", message: "No rows found" } });
    const res = await app.request("/flights/f1", { headers: AUTH_HEADER }, TEST_ENV);
    expect(res.status).toBe(404);
  });

  it("行が無い以外の DB エラーは 404 で隠さず 500 にする", async () => {
    useStub({ error: { code: "08006", message: "connection failure" } });
    const res = await app.request("/flights/f1", { headers: AUTH_HEADER }, TEST_ENV);
    expect(res.status).toBe(500);
  });

  it("PATCH で対象が無ければ 500 ではなく 404", async () => {
    useStub({ error: { code: "PGRST116", message: "No rows found" } });
    const res = await json("PATCH", "/flights/does-not-exist", VALID_FLIGHT);
    expect(res.status).toBe(404);
  });

  it("id と user_id の両方で絞る", async () => {
    const stub = useStub({ data: ROW });
    await app.request("/flights/f1", { headers: AUTH_HEADER }, TEST_ENV);
    expect(stub.argsOf("eq")).toContainEqual(["id", "f1"]);
    expect(stub.argsOf("eq")).toContainEqual(["user_id", USER.id]);
  });

  it("PATCH は PP を計算し直し、user_id は更新対象に含めない", async () => {
    const stub = useStub({ data: ROW });
    const res = await json("PATCH", "/flights/f1", { ...VALID_FLIGHT, cabin: "first" });

    expect(res.status).toBe(200);
    const [[updated]] = stub.argsOf("update");
    expect(updated).toMatchObject({ pp: calcPP("FUK", "OKA", "first", "simple", "2026-06-01") });
    expect(updated).not.toHaveProperty("user_id");
  });

  it("DELETE は ok を返す", async () => {
    const stub = useStub();
    const res = await app.request(
      "/flights/f1",
      { method: "DELETE", headers: AUTH_HEADER },
      TEST_ENV
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    expect(stub.argsOf("delete")).toHaveLength(1);
  });
});

describe("エラー応答", () => {
  it("壊れた JSON ボディは 500 ではなく 400", async () => {
    useStub();
    const res = await app.request(
      "/flights",
      {
        method: "POST",
        headers: { ...AUTH_HEADER, "content-type": "application/json" },
        body: "{oops",
      },
      TEST_ENV
    );
    // Hono 自身が投げる HTTPException を拾い損ねると、
    // クライアントの入力ミスが全部サーバ障害に見える。
    expect(res.status).toBe(400);
    expect((await readJson<ErrorBody>(res)).error.message).toBeTruthy();
  });

  it("CORS_ORIGIN 未設定は黙って全滅させず明示的に落とす", async () => {
    useStub({ data: [] });
    const res = await app.request(
      "/flights",
      { headers: AUTH_HEADER },
      {
        ...TEST_ENV,
        CORS_ORIGIN: "",
      }
    );
    expect(res.status).toBe(500);
    expect((await readJson<ErrorBody>(res)).error.message).toContain("CORS_ORIGIN");
  });
});

describe("GET /flights/sample-csv", () => {
  it("BOM 付きで返す (Excel の文字化け対策)", async () => {
    const res = await app.request("/flights/sample-csv", {}, TEST_ENV);
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("text/csv");
    // Response.text() は仕様上 UTF-8 復号時に先頭 BOM を落とす。
    // Excel が実際に読むのはバイト列なので、そちらで確かめる。
    const bytes = new Uint8Array(await res.arrayBuffer());
    expect([...bytes.slice(0, 3)]).toEqual([0xef, 0xbb, 0xbf]);
    expect(new TextDecoder().decode(bytes)).toContain("flown_at,flight_number,from_airport");
  });

  it(":id ルートに飲み込まれない", async () => {
    useStub({ data: ROW });
    const res = await app.request("/flights/sample-csv", {}, TEST_ENV);
    expect(res.headers.get("content-type")).toContain("text/csv");
  });
});
