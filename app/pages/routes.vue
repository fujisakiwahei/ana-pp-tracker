<script setup lang="ts">
import { ROUTES, type AirportCode, type CabinClass, type FareType, type Route } from "~~/shared/routes";
import { AIRPORTS } from "~~/shared/airports";

const hub = ref<AirportCode>("HND");
const cabin = ref<CabinClass>("economy");
const fareType = ref<FareType>("simple");

const HUBS: AirportCode[] = ["HND", "FUK", "OKA"];

const FARE_OPTIONS: Array<{ value: FareType; label: string }> = [
  { value: "simple", label: "シンプル" },
  { value: "standard", label: "スタンダード" },
  { value: "flex", label: "フレックス" },
];

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
      <div class="subhead-jp">国内線 路線一覧</div>
      <h1 class="section-title page-title">主要路線</h1>
    </div>
    <div class="cabin-switch">
      <div class="switch-group">
        <span class="cabin-label">クラス</span>
        <Segmented
          v-model="cabin"
          :options="[
            { value: 'economy', label: 'エコノミー' },
            { value: 'first', label: 'プレミアム' },
          ]"
        />
      </div>
      <div class="switch-group">
        <span class="cabin-label">運賃</span>
        <Segmented v-model="fareType" :options="FARE_OPTIONS" />
      </div>
    </div>
  </div>

  <div class="tabs hub-tabs">
    <button
      v-for="h in HUBS"
      :key="h"
      :class="['tab', { active: hub === h }]"
      @click="hub = h"
    >
      {{ AIRPORTS[h].name }}発
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
        :fare-type="fareType"
        :from="r.displayFrom"
        :to="r.displayTo"
      />
    </div>
    <p class="note">
      ※ 現在の日付に対応する運賃体系（〜2026/5/18 は旧、2026/5/19〜 は新）で試算しています。実際の積算PPは予約クラス・搭乗ポイント設定により変動します。
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
.subhead-jp {
  font-size: 12px;
  color: var(--ink-mute);
  letter-spacing: 0.04em;
  margin-bottom: 4px;
}
.cabin-switch {
  display: flex;
  gap: 18px;
  align-items: center;
  flex-wrap: wrap;
}
.switch-group {
  display: flex;
  gap: 10px;
  align-items: center;
}
.cabin-label {
  font-size: 12px;
  color: var(--ink-mute);
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
