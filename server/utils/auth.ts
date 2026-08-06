import type { H3Event } from "h3";
import { serverSupabaseUser } from "#supabase/server";

/**
 * Supabase クライアントの使い分けについて
 *
 * 各ハンドラは `serverSupabaseClient(event)` を使う。これはリクエスト元ユーザーの
 * トークンで動くため、flights テーブルの RLS ポリシーがそのまま効く。
 *
 * `serverSupabaseServiceRole(event)` は RLS を完全にバイパスするので使わない
 * (eslint の no-restricted-imports で禁止している)。以前は全7ハンドラがこちらを
 * 使っており、ユーザーのデータを分離しているのは各クエリに手書きされた
 * `.eq("user_id", user.id)` 1行だけ、という状態だった。
 *
 * その `.eq("user_id", ...)` は今も残してある。インデックス
 * (flights_user_flown_at_idx) を効かせるためと、意図を明示するため。
 * RLS はその後ろの防波堤として働く。
 */

export async function requireUser(event: H3Event) {
  const claims = await serverSupabaseUser(event);
  if (!claims || !claims.sub) {
    throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
  }
  return { id: claims.sub, email: claims.email as string | undefined, claims };
}
