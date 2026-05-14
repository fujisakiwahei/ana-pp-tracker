<script setup lang="ts">
import type { CabinClass, Route, AirportCode } from "~~/shared/routes";
import { AIRPORTS } from "~~/shared/airports";
import { buildAnaReservationUrl } from "~~/shared/pp";

const props = defineProps<{
  route: Route;
  cabin: CabinClass;
  from: AirportCode;
  to: AirportCode;
}>();

const ppOneWay = computed(() =>
  props.cabin === "first" ? props.route.ppFirst : props.route.ppEconomy,
);
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
        <span class="eyebrow">Base mi</span>
        <span class="val mono">{{ route.baseMiles.toLocaleString() }}</span>
      </div>
      <div class="stat accent">
        <span class="eyebrow">One-way</span>
        <span class="val mono">{{ ppOneWay.toLocaleString() }}</span>
      </div>
      <div class="stat">
        <span class="eyebrow">Round-trip</span>
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
