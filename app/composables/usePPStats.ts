export interface SummaryResponse {
  year: number;
  totalPP: number;
  goalPP: number;
  remainingPP: number;
  progress: number;
  flightsCount: number;
}

export function usePPStats(year?: MaybeRefOrGetter<number | undefined>) {
  return useFetch<SummaryResponse>("/api/stats/summary", {
    query: computed(() => {
      const y = toValue(year);
      return y ? { year: y } : {};
    }),
  });
}
