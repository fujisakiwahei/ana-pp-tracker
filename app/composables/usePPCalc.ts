import type { AirportCode, CabinClass, FareType } from "~~/shared/routes";
import { calcPPBreakdown, findRoute, isNewFareEra } from "~~/shared/pp";

export function usePPCalc(
  from: MaybeRefOrGetter<AirportCode | undefined>,
  to: MaybeRefOrGetter<AirportCode | undefined>,
  cabin: MaybeRefOrGetter<CabinClass | undefined>,
  fareType: MaybeRefOrGetter<FareType | undefined>,
  flownAt: MaybeRefOrGetter<string | undefined>
) {
  const route = computed(() => {
    const f = toValue(from);
    const t = toValue(to);
    if (!f || !t || f === t) return undefined;
    return findRoute(f, t);
  });

  /** 積算率・搭乗ポイントを含む内訳。UI はこれを表示にそのまま使う。 */
  const breakdown = computed(() => {
    const f = toValue(from);
    const t = toValue(to);
    const c = toValue(cabin);
    const ft = toValue(fareType);
    const dt = toValue(flownAt);
    if (!f || !t || !c || !dt || f === t) return null;
    return calcPPBreakdown(f, t, c, ft, dt);
  });

  const pp = computed(() => breakdown.value?.total ?? null);

  const isNewEra = computed(() => {
    const dt = toValue(flownAt);
    return dt ? isNewFareEra(dt) : true;
  });

  return { route, breakdown, pp, isNewEra };
}
