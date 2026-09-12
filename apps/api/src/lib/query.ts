/**
 * クエリ文字列を整数として読む。未指定・数値でない場合は fallback。
 *
 * Nuxt 版は `Number(query.year ?? getCurrentYear())` と書いていて、
 * `?year=abc` が NaN のまま `NaN-01-01` という日付文字列になっていた
 * (エラーにはならず、黙って0件が返る)。ここで潰しておく。
 */
export function intQuery(raw: string | undefined, fallback: number): number {
  if (raw == null || raw === "") return fallback;
  const n = Number(raw);
  return Number.isFinite(n) ? Math.trunc(n) : fallback;
}
