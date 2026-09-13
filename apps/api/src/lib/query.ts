/** 集計年度として受け付ける範囲。路線テーブルの想定から大きく外れた値は弾く。 */
const MIN_YEAR = 2000;
const MAX_YEAR = 2999;

/**
 * クエリ文字列を整数として読む。未指定・数値として読めない場合は fallback。
 *
 * Nuxt 版は `Number(query.year ?? getCurrentYear())` と書いていて、
 * `?year=abc` が NaN のまま `NaN-01-01` という日付文字列になっていた
 * (エラーにはならず、黙って0件が返る)。
 *
 * Number.isFinite だけでは足りない。`?year=1e21` は有限なので通ってしまい、
 * `1e+21-01-01` という同じく無意味な日付文字列になる。安全な整数に限る。
 */
export function intQuery(raw: string | undefined, fallback: number): number {
  if (raw == null || raw === "") return fallback;
  const n = Number(raw);
  return Number.isSafeInteger(n) ? n : fallback;
}

/** 年度クエリ。読めない値・範囲外は fallback に倒す。 */
export function yearQuery(raw: string | undefined, fallback: number): number {
  const n = intQuery(raw, fallback);
  return n >= MIN_YEAR && n <= MAX_YEAR ? n : fallback;
}

/** ページングのクエリ。負値や 0 を DB に渡すと range が反転して 500 になる。 */
export function rangeQuery(
  rawLimit: string | undefined,
  rawOffset: string | undefined,
  defaultLimit: number,
  maxLimit: number
): { limit: number; offset: number } {
  const limit = Math.min(Math.max(intQuery(rawLimit, defaultLimit), 1), maxLimit);
  const offset = Math.max(intQuery(rawOffset, 0), 0);
  return { limit, offset };
}
