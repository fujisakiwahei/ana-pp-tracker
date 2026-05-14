import type { AirportCode, CabinClass, FareType } from "~~/shared/routes";
import { calcPP, findRoute, isNewFareEra } from "~~/shared/pp";

export function usePPCalc(
  from: MaybeRefOrGetter<AirportCode | undefined>,
  to: MaybeRefOrGetter<AirportCode | undefined>,
  cabin: MaybeRefOrGetter<CabinClass | undefined>,
  fareType: MaybeRefOrGetter<FareType | undefined>,
  flownAt: MaybeRefOrGetter<string | undefined>,
) {
  const route = computed(() => {
    const f = toValue(from);
    const t = toValue(to);
    if (!f || !t || f === t) return undefined;
    return findRoute(f, t);
  });

  const pp = computed(() => {
    const f = toValue(from);
    const t = toValue(to);
    const c = toValue(cabin);
    const ft = toValue(fareType);
    const dt = toValue(flownAt);
    if (!f || !t || !c || !dt || f === t) return null;
    return calcPP(f, t, c, ft, dt);
  });

  const isNewEra = computed(() => {
    const dt = toValue(flownAt);
    return dt ? isNewFareEra(dt) : true;
  });

  return { route, pp, isNewEra };
}
