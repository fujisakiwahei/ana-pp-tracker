<script setup lang="ts">
import type { CabinClass, Route, AirportCode, FareType } from "~~/shared/routes";
import { AIRPORTS } from "~~/shared/airports";
import { buildAnaReservationUrl, calcPP } from "~~/shared/pp";

const props = withDefaults(
  defineProps<{
    route: Route;
    cabin: CabinClass;
    from: AirportCode;
    to: AirportCode;
    fareType?: FareType;
    flownAt?: string;
  }>(),
  { fareType: "simple" },
);

const ppOneWay = computed(() => {
  const dt = props.flownAt ?? new Date().toISOString().slice(0, 10);
  return calcPP(props.from, props.to, props.cabin, props.fareType, dt) ?? 0;
});
const ppRoundTrip = computed(() => ppOneWay.value * 2);

const reservationUrl = computed(() =>
  buildAnaReservationUrl(props.from, props.to),
);
</script>

<template>
  <article class="card route">
    <header>
      <RouteCodeBadge :from="from" :to="to" big />
      <span class="mult mono">×2</span>
    </header>
    <div class="names">
      {{ AIRPORTS[from].name }} ⇄ {{ AIRPORTS[to].name }}
    </div>
    <div class="stats">
      <div class="stat">
        <span class="lbl">基本マイル</span>
        <span class="val mono">{{ route.baseMiles.toLocaleString() }}</span>
      </div>
      <div class="stat accent">
        <span class="lbl">片道PP</span>
        <span class="val mono">{{ ppOneWay.toLocaleString() }}</span>
      </div>
      <div class="stat">
        <span class="lbl">往復PP</span>
        <span class="val mono">{{ ppRoundTrip.toLocaleString() }}</span>
      </div>
    </div>
    <footer>
      <CabinPill :cabin="cabin" />
      <a class="btn-link" :href="reservationUrl" target="_blank" rel="noopener">
        ANAで予約 →
      </a>
    </footer>
  </article>
</template>

<style lang="scss" scoped>
.route {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
}
.mult {
  font-size: 10px;
  letter-spacing: 0.15em;
  color: var(--ink-mute);
}
.names {
  color: var(--ink-soft);
  font-size: 12.5px;
}
.stats {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  border-top: 1px solid var(--line);
  border-bottom: 1px solid var(--line);
  padding: 14px 0;
  gap: 0;
}
.stat {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding-right: 8px;
}
.stat .lbl {
  font-size: 10.5px;
  color: var(--ink-mute);
  letter-spacing: 0.04em;
}
.stat .val {
  font-size: 16px;
  font-weight: 400;
  letter-spacing: -0.01em;
  color: var(--ink-soft);
}
.stat.accent .val {
  font-size: 22px;
  font-weight: 500;
  color: var(--ink);
}
footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 4px;
}
</style>
