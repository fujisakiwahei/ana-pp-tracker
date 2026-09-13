import type { ContentfulStatusCode } from "hono/utils/http-status";

/**
 * API のエラーはこのクラスに一本化する。
 *
 * Nuxt 時代は createError() の戻りがそのまま Nitro のエラー形式
 * ({ statusCode, statusMessage, data }) で出ていて、レスポンスの形が
 * フレームワーク任せだった。クライアントが Web と iOS の2つになる以上、
 * { error: { message, issues? } } に固定して Swift 側でもデコードできるようにする。
 */
export class ApiError extends Error {
  constructor(
    readonly status: ContentfulStatusCode,
    message: string,
    readonly issues?: unknown
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * PostgREST が「該当行なし」を返すときのコード。
 * .single() は行が無い場合もエラーとして返してくるので、
 * 本当の障害と取り違えないよう区別する。
 */
export const PGRST_NO_ROWS = "PGRST116";

export interface SupabaseError {
  code?: string;
  message: string;
}

/**
 * Supabase のエラーを ApiError に変換する。
 * 行が無いだけなら 404、それ以外は 500。
 *
 * 以前は GET /flights/:id が「接続断も含めて何でも 404」、
 * PATCH /flights/:id が「存在しない行も含めて何でも 500」という
 * 非対称な状態だった。
 */
export function fromSupabaseError(error: SupabaseError): ApiError {
  return error.code === PGRST_NO_ROWS
    ? new ApiError(404, "Not Found")
    : new ApiError(500, error.message);
}

export interface ApiErrorBody {
  error: { message: string; issues?: unknown };
}

export function toErrorBody(err: ApiError): ApiErrorBody {
  return { error: { message: err.message, ...(err.issues ? { issues: err.issues } : {}) } };
}
