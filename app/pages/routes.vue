<script setup lang="ts">
import { ROUTES, type AirportCode, type CabinClass, type Route } from "~~/shared/routes";
import { AIRPORTS } from "~~/shared/airports";

const hub = ref<AirportCode>("HND");
const cabin = ref<CabinClass>("economy");

const HUBS: AirportCode[] = ["HND", "FUK", "OKA"];

interface NormalizedRoute extends Route {
  displayFrom: AirportCode;
  displayTo: AirportCode;
}

const routes = computed<NormalizedRoute[]>(() => {
  return ROUTES
    .filter((r) => r.from === hub.value || r.to === hub.value)
    .map((r) => {
      if (r.from === hub.value) {
        return { ...r, displayFrom: r.from, displayTo: r.to };
      }
      return { ...r, displayFrom: r.to, displayTo: r.from };
    })
    .sort((a, b) => b.baseMiles - a.baseMiles);
});
</script>

<template>
  <div class="subheader">
    <div>
      <div class="eyebrow">Domestic route directory</div>
      <h1 class="section-title page-title">主要路線</h1>
    </div>
    <div class="cabin-switch">
      <span class="eyebrow">Cabin</span>
      <Segmented
        v-model="cabin"
        :options="[
          { value: 'economy', label: 'Economy' },
          { value: 'first', label: 'First' },
        ]"
      />
    </div>
  </div>

  <div class="tabs hub-tabs">
    <button
      v-for="h in HUBS"
      :key="h"
      :class="['tab', { active: hub === h }]"
      @click="hub = h"
    >
      {{ AIRPORTS[h].name }}
      <span class="sub">{{ h }} · {{ AIRPORTS[h].city }}</span>
    </button>
  </div>

  <div class="page-body">
    <div class="grid">
      <RouteCard
        v-for="r in routes"
        :key="`${r.from}-${r.to}`"
        :route="r"
        :cabin="cabin"
        :from="r.displayFrom"
        :to="r.displayTo"
      />
    </div>
    <p class="note mono">
      ※ 標準的なシンプル運賃を前提に試算した代表値です。実際の積算PPは購入運賃によって変動します。
    </p>
  </div>
</template>

<style lang="scss" scoped>
.page-title {
  font-size: 32px;
  @media (min-width: 768px) {
    font-size: 40px;
  }
}
.cabin-switch {
  display: flex;
  gap: 18px;
  align-items: center;
}
.hub-tabs {
  padding: 0 28px;
  @media (min-width: 768px) {
    padding: 0 48px;
  }
}
.grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 18px;
  @media (min-width: 600px) {
    grid-template-columns: 1fr 1fr;
  }
  @media (min-width: 1024px) {
    grid-template-columns: 1fr 1fr 1fr;
  }
}
.note {
  margin-top: 40px;
  font-size: 11px;
  color: var(--ink-mute);
  letter-spacing: 0.04em;
}
</style>
