import { Hono } from "hono";
import { cors } from "hono/cors";
import { ApiError, toErrorBody } from "./lib/errors";
import { flights } from "./routes/flights";
import { pp } from "./routes/pp";
import { stats } from "./routes/stats";
import type { AppEnv } from "./types";

const app = new Hono<AppEnv>();

app.use("*", (c, next) =>
  cors({
    origin: (c.env.CORS_ORIGIN ?? "")
      .split(",")
      .map((o) => o.trim())
      .filter(Boolean),
    allowHeaders: ["Authorization", "Content-Type"],
    allowMethods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    maxAge: 86400,
  })(c, next)
);

app.onError((err, c) => {
  if (err instanceof ApiError) {
    return c.json(toErrorBody(err), err.status);
  }
  console.error(err);
  return c.json(toErrorBody(new ApiError(500, "Internal Server Error")), 500);
});

app.notFound((c) => c.json(toErrorBody(new ApiError(404, "Not Found")), 404));

app.route("/flights", flights);
app.route("/stats", stats);
app.route("/pp", pp);

export default app;
