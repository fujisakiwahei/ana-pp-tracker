import { createMiddleware } from "hono/factory";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@ana/core/database.types";
import { ApiError } from "../lib/errors";
import type { AppEnv } from "../types";

/**
 * Supabase クライアントの使い分けについて (Nuxt 版 server/utils/auth.ts から引き継ぐ方針)
 *
 * リクエストごとに、そのユーザーの JWT を載せたクライアントを作る。
 * こうすると flights テーブルの RLS ポリシーがそのまま効く。
 * Service Role キーは Workers の環境変数にも置かない。置かなければ誤用も起こらない。
 *
 * 各クエリの `.eq("user_id", user.id)` は Nuxt 版と同じく残してある。
 * インデックス (flights_user_flown_at_idx) を効かせるためと、意図を明示するため。
 * RLS はその後ろの防波堤として働く。
 */
export const requireUser = createMiddleware<AppEnv>(async (c, next) => {
  const header = c.req.header("Authorization");
  const token = header?.startsWith("Bearer ") ? header.slice("Bearer ".length).trim() : undefined;
  if (!token) throw new ApiError(401, "Unauthorized");

  const db = createClient<Database>(c.env.SUPABASE_URL, c.env.SUPABASE_PUBLISHABLE_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });

  const { data, error } = await db.auth.getUser();
  if (error || !data.user) throw new ApiError(401, "Unauthorized");

  c.set("user", { id: data.user.id, email: data.user.email });
  c.set("db", db);
  await next();
});
