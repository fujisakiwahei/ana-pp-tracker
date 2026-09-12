/**
 * $fetch / Supabase が投げたエラーから画面表示用のメッセージを取り出す。
 *
 * 拾う順に意味がある。
 * 1. `data.error.message` … Hono API が返す形 (apps/api/src/lib/errors.ts)。
 *    $fetch はレスポンスボディを `data` に載せてくる。
 * 2. `statusMessage` … Nuxt の createError。server routes を消した今も、
 *    navigateTo 周りなどフレームワーク内部が投げうるので残す。
 * 3. `message` … Supabase SDK と標準の Error。
 */
export function toErrorMessage(e: unknown, fallback: string): string {
  if (typeof e === "object" && e !== null) {
    const err = e as { data?: unknown; statusMessage?: unknown; message?: unknown };

    const data = err.data as { error?: { message?: unknown } } | undefined;
    const apiMessage = data?.error?.message;
    if (typeof apiMessage === "string" && apiMessage) return apiMessage;

    if (typeof err.statusMessage === "string" && err.statusMessage) return err.statusMessage;
    if (typeof err.message === "string" && err.message) return err.message;
  }
  return fallback;
}
