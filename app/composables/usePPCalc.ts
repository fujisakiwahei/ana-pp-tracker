import type { AirportCode, CabinClass } from "~~/shared/routes";
import { calcPP, findRoute } from "~~/shared/pp";

export function usePPCalc(
  from: MaybeRefOrGetter<AirportCode | undefined>,
  to: MaybeRefOrGetter<AirportCode | undefined>,
  cabin: MaybeRefOrGetter<CabinClass | undefined>,
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
    if (!f || !t || !c || f === t) return null;
    return calcPP(f, t, c);
  });

  return { route, pp };
}
