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

export interface ApiErrorBody {
  error: { message: string; issues?: unknown };
}

export function toErrorBody(err: ApiError): ApiErrorBody {
  return { error: { message: err.message, ...(err.issues ? { issues: err.issues } : {}) } };
}
