import { Hono } from "hono";
import { z } from "zod";
import { airportCodeSchema, cabinClassSchema, fareTypeSchema } from "@ana/core/schema";
import { calcPPBreakdown, PP_RESOLVE_ERROR_MESSAGE } from "@ana/core/pp";
import { ApiError } from "../lib/errors";
import { queryParams } from "../lib/validator";
import type { AppEnv } from "../types";

const previewQuerySchema = z.object({
  from: airportCodeSchema,
  to: airportCodeSchema,
  cabin: cabinClassSchema,
  fare_type: fareTypeSchema.optional(),
  flown_at: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, {
    message: "搭乗日は YYYY-MM-DD 形式で指定してください",
  }),
});

export const pp = new Hono<AppEnv>();

/**
 * 片道PPの内訳を返す。フォームの入力中プレビュー用。
 *
 * iOS アプリは PP を自分で計算しない (運賃テーブルを Swift に二重実装しないため)ので、
 * 記録前に金額感を出すにはサーバ側の口が要る。Nuxt 版ではクライアントが
 * calcPPBreakdown() を直接呼んでいた部分に相当する。
 *
 * 認証を掛けていないのは意図的。返すのは ANA が公開している運賃表の計算結果だけで
 * ユーザーのデータを一切含まない。認証を挟むと入力1文字ごとに Supabase への
 * 往復が増えるので、掛けない方が正しい。
 */
pp.get("/preview", queryParams(previewQuerySchema), (c) => {
  const q = c.req.valid("query");
  const breakdown = calcPPBreakdown(q.from, q.to, q.cabin, q.fare_type, q.flown_at);
  if (!breakdown) throw new ApiError(400, PP_RESOLVE_ERROR_MESSAGE);
  return c.json(breakdown);
});
