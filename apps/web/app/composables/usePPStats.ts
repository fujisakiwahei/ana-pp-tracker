export interface SummaryResponse {
  year: number;
  confirmedPP: number;
  tentativePP: number;
  boardedPP: number;
  goalPP: number;
  remainingPP: number;
  progress: number;
  tentativeProgress: number;
  boardedProgress: number;
  flightsCount: number;
  confirmedCount: number;
  tentativeCount: number;
}

/**
 * 年間サマリー。
 *
 * useFetch から useAsyncData + $fetch に変えてある。Authorization ヘッダを
 * リクエストの都度 (= トークン更新後も正しい値で) 組み立てる必要があるため。
 *
 * key は呼び出し側で分ける。同じ key を別々のオプションで使うと
 * Nuxt が片方のオプションを黙って捨てる。
 */
export function usePPStats(year?: MaybeRefOrGetter<number | undefined>, key = "pp-summary") {
  const { apiUrl, authHeaders } = useApi();

  return useAsyncData<SummaryResponse>(
    key,
    () => {
      const y = toValue(year);
      return $fetch<SummaryResponse>(apiUrl("/stats/summary"), {
        headers: authHeaders(),
        query: y ? { year: y } : {},
      });
    },
    { watch: [() => toValue(year)] }
  );
}
