/**
 * supabase-js のクエリビルダーを最小限だけ真似たスタブ。
 *
 * ビルダーは thenable (await でそのまま結果になる) なので、
 * チェーン用メソッドを生やしたオブジェクトに then を足すだけで足りる。
 * 呼ばれたメソッドと引数は calls に記録し、
 * 「どの列で絞ったか」「何行 insert したか」をテストから検証できるようにする。
 */
const CHAIN_METHODS = [
  "select",
  "eq",
  "gte",
  "lte",
  "order",
  "range",
  "insert",
  "update",
  "delete",
  "single",
] as const;

export interface StubCall {
  table: string;
  method: (typeof CHAIN_METHODS)[number];
  args: unknown[];
}

export interface StubOptions {
  user?: { id: string; email?: string } | null;
  data?: unknown;
  error?: { code?: string; message: string } | null;
  count?: number;
}

export function createSupabaseStub(opts: StubOptions = {}) {
  const calls: StubCall[] = [];
  const result = { data: opts.data ?? null, error: opts.error ?? null, count: opts.count ?? 0 };

  const from = (table: string) => {
    const chain = {} as Record<string, unknown>;
    for (const method of CHAIN_METHODS) {
      chain[method] = (...args: unknown[]) => {
        calls.push({ table, method, args });
        return chain;
      };
    }
    chain.then = (onOk: (v: unknown) => unknown, onErr?: (e: unknown) => unknown) =>
      Promise.resolve(result).then(onOk, onErr);
    return chain;
  };

  const client = {
    from,
    auth: {
      getUser: async () => ({
        data: { user: opts.user ?? null },
        error: opts.user ? null : { message: "invalid token" },
      }),
    },
  };

  const argsOf = (method: StubCall["method"]) =>
    calls.filter((call) => call.method === method).map((call) => call.args);

  return { calls, client, argsOf };
}

export const TEST_ENV = {
  SUPABASE_URL: "https://test.supabase.co",
  SUPABASE_PUBLISHABLE_KEY: "sb_publishable_test",
  CORS_ORIGIN: "http://localhost:3000",
};

export const USER = { id: "11111111-1111-1111-1111-111111111111", email: "a@example.com" };

export const AUTH_HEADER = { Authorization: "Bearer test-token" };
