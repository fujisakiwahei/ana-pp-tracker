import { Hono } from "hono";
import { cors } from "hono/cors";
import { HTTPException } from "hono/http-exception";
import type { MiddlewareHandler } from "hono";
import { ApiError, toErrorBody } from "./lib/errors";
import { flights } from "./routes/flights";
import { pp } from "./routes/pp";
import { stats } from "./routes/stats";
import type { AppEnv } from "./types";

const app = new Hono<AppEnv>();

/**
 * cors() はオプションからクロージャを組み立てるので、リクエストごとに作り直さない。
 * オリジンの設定は環境変数なので、その値をキーに1度だけ作る。
 */
const corsCache = new Map<string, MiddlewareHandler>();

function corsFor(rawOrigins: string | undefined): MiddlewareHandler {
  // 未設定のまま起動すると Access-Control-Allow-Origin が付かず、
  // ブラウザは 200 のレスポンスを黙って捨てる。サーバ側にはエラーも残らないので、
  // 設定漏れは起動時ではなく最初のリクエストで明示的に落とす。
  if (!rawOrigins) {
    throw new ApiError(500, "CORS_ORIGIN が未設定です。許可するオリジンを設定してください。");
  }
  const cached = corsCache.get(rawOrigins);
  if (cached) return cached;

  const middleware = cors({
    origin: rawOrigins
      .split(",")
      .map((o) => o.trim())
      .filter(Boolean),
    allowHeaders: ["Authorization", "Content-Type"],
    allowMethods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    maxAge: 86400,
  });
  corsCache.set(rawOrigins, middleware);
  return middleware;
}

app.use("*", (c, next) => corsFor(c.env.CORS_ORIGIN)(c, next));

app.onError((err, c) => {
  if (err instanceof ApiError) {
    return c.json(toErrorBody(err), err.status);
  }
  // Hono 自身が投げるもの (不正な JSON ボディ、壊れた FormData、
  // Content-Type 不一致など) は既に正しいステータスを持っている。
  // ここで拾わないと、クライアントの入力ミスが全部 500 になる。
  if (err instanceof HTTPException) {
    return c.json(toErrorBody(new ApiError(err.status, err.message)), err.status);
  }
  console.error(err);
  return c.json(toErrorBody(new ApiError(500, "Internal Server Error")), 500);
});

app.notFound((c) => c.json(toErrorBody(new ApiError(404, "Not Found")), 404));

app.route("/flights", flights);
app.route("/stats", stats);
app.route("/pp", pp);

export default app;
