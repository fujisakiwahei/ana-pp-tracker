import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ErrorBody, ImportErrorBody } from "./json";
import { readJson } from "./json";
import { AUTH_HEADER, createSupabaseStub, TEST_ENV, USER } from "./supabaseStub";

const mocked = vi.hoisted(() => ({ client: undefined as unknown }));
vi.mock("@supabase/supabase-js", () => ({ createClient: () => mocked.client }));

const app = (await import("../src/index")).default;

const HEADER =
  "flown_at,flight_number,from_airport,to_airport,cabin,fare_type,pp,aircraft,seat,lounge,rating_seat,rating_aircraft,rating_lounge,notes";

function useStub(opts: Parameters<typeof createSupabaseStub>[0] = {}) {
  const stub = createSupabaseStub({ user: USER, ...opts });
  mocked.client = stub.client;
  return stub;
}

function upload(csv: string, filename = "flights.csv") {
  const form = new FormData();
  form.append("file", new File([csv], filename, { type: "text/csv" }));
  return app.request(
    "/flights/import",
    { method: "POST", headers: AUTH_HEADER, body: form },
    TEST_ENV
  );
}

beforeEach(() => {
  mocked.client = undefined;
});

describe("POST /flights/import", () => {
  it("全行通れば件数を返す", async () => {
    const stub = useStub();
    const res = await upload(
      [
        HEADER,
        "2026-06-01,NH256,FUK,OKA,economy,simple,,,,,,,,",
        "2026-06-03,NH257,OKA,FUK,economy,simple,,,,,,,,",
      ].join("\n")
    );

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true, inserted: 2 });
    const [[rows]] = stub.argsOf("insert");
    expect(rows).toHaveLength(2);
  });

  it("CSV の既定ステータスは搭乗確定 (フォームとは逆)", async () => {
    const stub = useStub();
    await upload([HEADER, "2026-06-01,NH256,FUK,OKA,economy,simple,,,,,,,,"].join("\n"));
    const [[rows]] = stub.argsOf("insert");
    expect((rows as Array<Record<string, unknown>>)[0]).toMatchObject({ status: "confirmed" });
  });

  it("BOM 付きのファイルでも読める (Excel 保存対策)", async () => {
    useStub();
    const res = await upload(
      "\uFEFF" + [HEADER, "2026-06-01,NH256,FUK,OKA,economy,simple,,,,,,,,"].join("\n")
    );
    expect(await res.json()).toEqual({ ok: true, inserted: 1 });
  });

  it("不正な行は行番号付きで返し、1行も insert しない", async () => {
    const stub = useStub();
    const res = await upload(
      [
        HEADER,
        "2026-06-01,NH256,FUK,OKA,economy,simple,,,,,,,,",
        "2026-06-03,NH257,XXX,FUK,economy,simple,,,,,,,,",
      ].join("\n")
    );

    expect(res.status).toBe(400);
    const body = await readJson<ImportErrorBody>(res);
    expect(body.ok).toBe(false);
    expect(body.errors).toHaveLength(1);
    expect(body.errors[0].row).toBe(3); // ヘッダが1行目
    expect(stub.argsOf("insert")).toHaveLength(0);
  });

  it("PP を解決できない行も行エラーとして返す", async () => {
    useStub();
    const res = await upload(
      [HEADER, "2026-06-01,NH256,NRT,OKA,economy,simple,,,,,,,,"].join("\n")
    );
    const body = await readJson<ImportErrorBody>(res);
    expect(res.status).toBe(400);
    expect(body.errors[0].issues[0].path).toEqual(["pp"]);
  });

  it("ファイルが無ければ 400", async () => {
    useStub();
    const res = await app.request(
      "/flights/import",
      { method: "POST", headers: AUTH_HEADER, body: new FormData() },
      TEST_ENV
    );
    expect(res.status).toBe(400);
    expect((await readJson<ErrorBody>(res)).error.message).toContain("CSVファイルが見つかりません");
  });

  it("認証が無ければ 401 (ファイルを読む前に弾く)", async () => {
    useStub({ user: null });
    const res = await upload([HEADER].join("\n"));
    expect(res.status).toBe(401);
  });
});
