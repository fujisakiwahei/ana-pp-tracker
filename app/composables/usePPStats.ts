export interface SummaryResponse {
  year: number;
  confirmedPP: number;
  tentativePP: number;
  goalPP: number;
  remainingPP: number;
  progress: number;
  tentativeProgress: number;
  flightsCount: number;
  confirmedCount: number;
  tentativeCount: number;
}

export function usePPStats(year?: MaybeRefOrGetter<number | undefined>) {
  return useFetch<SummaryResponse>("/api/stats/summary", {
    query: computed(() => {
      const y = toValue(year);
      return y ? { year: y } : {};
    }),
  });
}
