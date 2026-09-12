import { zValidator } from "@hono/zod-validator";
import type { ZodType } from "zod";
import { ApiError } from "./errors";

/**
 * 検証失敗を ApiError に寄せるための薄いラッパ。
 * zValidator の既定は独自形式の 400 を直接返してしまい、
 * errors.ts で決めたレスポンス形から外れる。
 */
function onFail(result: { success: boolean; error?: { issues: unknown } }) {
  if (!result.success) {
    throw new ApiError(400, "Validation failed", result.error?.issues);
  }
}

export const jsonBody = <T extends ZodType>(schema: T) => zValidator("json", schema, onFail);

export const queryParams = <T extends ZodType>(schema: T) => zValidator("query", schema, onFail);
