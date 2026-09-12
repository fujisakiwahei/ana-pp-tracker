import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@ana/core/database.types";

export interface Bindings {
  SUPABASE_URL: string;
  /** 公開可能な anon / publishable キー。Service Role は置かない (RLS をバイパスするため)。 */
  SUPABASE_PUBLISHABLE_KEY: string;
  /** CORS で許可するオリジン。カンマ区切りで複数指定できる。 */
  CORS_ORIGIN: string;
}

export interface Variables {
  user: { id: string; email?: string };
  /** リクエスト元ユーザーの JWT を載せた Supabase クライアント。RLS が効く。 */
  db: SupabaseClient<Database>;
}

export type AppEnv = { Bindings: Bindings; Variables: Variables };
