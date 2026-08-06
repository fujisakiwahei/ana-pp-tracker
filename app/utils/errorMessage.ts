/**
 * $fetch / Supabase が投げたエラーから画面表示用のメッセージを取り出す。
 *
 * Nuxt の `createError` は `statusMessage`、Supabase や標準の Error は `message` に
 * 文言を載せてくるため、その順で拾って最後に fallback へ落とす。
 */
export function toErrorMessage(e: unknown, fallback: string): string {
  if (typeof e === "object" && e !== null) {
    const err = e as { statusMessage?: unknown; message?: unknown };
    if (typeof err.statusMessage === "string" && err.statusMessage) return err.statusMessage;
    if (typeof err.message === "string" && err.message) return err.message;
  }
  return fallback;
}
