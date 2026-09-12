/**
 * Hono API (apps/api) への接続情報。
 *
 * 以前は Nuxt の server routes が同一オリジンに居たので `/api/...` を直接
 * 叩いていた。API が別オリジンの Worker になったため、ベースURLと
 * Authorization ヘッダをここ1箇所に集約する。
 *
 * 認証は Bearer トークンのみ (Cookie は使わない)。iOS アプリと同じ経路を
 * Web も通ることになり、API 側の認証パスが1本で済む。
 */
export function useApi() {
  const {
    public: { apiBase },
  } = useRuntimeConfig();
  const session = useSupabaseSession();

  /** 認証不要のエンドポイントを <a href> から開くとき用。 */
  const apiUrl = (path: string) => `${apiBase}${path}`;

  /**
   * 未ログインなら空を返す。API 側が 401 を返すので、ここでは投げない
   * (画面遷移は @nuxtjs/supabase の redirectOptions が受け持つ)。
   */
  const authHeaders = (): Record<string, string> => {
    const token = session.value?.access_token;
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  return { apiUrl, authHeaders };
}
