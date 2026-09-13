/**
 * Response.json() は unknown を返すので、テスト側で期待する形を明示する。
 * API のレスポンス形が変わったらここの型と食い違い、テストが型エラーになる。
 */
export async function readJson<T>(res: Response): Promise<T> {
  return (await res.json()) as T;
}

/** src/lib/errors.ts の ApiErrorBody と同じ形。 */
export interface ErrorBody {
  error: { message: string; issues?: unknown };
}

/** CSV 取り込みが行エラーを返すときの形。 */
export interface ImportErrorBody {
  ok: false;
  errors: Array<{ row: number; issues: Array<{ path: (string | number)[]; message: string }> }>;
}
