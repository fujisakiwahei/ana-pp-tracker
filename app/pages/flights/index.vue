<script setup lang="ts">
import type { AirportCode, CabinClass } from "~~/shared/routes";
import type { FlightRow } from "~~/shared/schema";
import { getCurrentYear } from "~~/shared/pp";

const currentYear = getCurrentYear();
const year = ref(currentYear);
const cabin = ref<CabinClass | "all">("all");
const hub = ref<AirportCode | "all">("all");

const yearOptions = computed(() => {
  const years: number[] = [];
  for (let y = currentYear; y >= currentYear - 4; y--) years.push(y);
  return years;
});

const { data, refresh } = await useFetch<{ items: FlightRow[]; total: number; year: number }>(
  "/api/flights",
  {
    query: computed(() => ({ year: year.value, limit: 500 })),
  },
);

const filtered = computed(() => {
  const items = data.value?.items ?? [];
  return items.filter((f) => {
    if (cabin.value !== "all" && f.cabin !== cabin.value) return false;
    if (hub.value !== "all") {
      if (f.from_airport !== hub.value && f.to_airport !== hub.value)
        return false;
    }
    return true;
  });
});

const totalPP = computed(() => filtered.value.reduce((s, f) => s + f.pp, 0));
</script>

<template>
  <div class="subheader">
    <div>
      <div class="subhead-jp">{{ year }}年の記録</div>
      <h1 class="section-title page-title">搭乗履歴</h1>
    </div>
    <div class="controls">
      <FlightFilters
        :year="year"
        :cabin="cabin"
        :hub="hub"
        :year-options="yearOptions"
        @update:year="year = $event"
        @update:cabin="cabin = $event"
        @update:hub="hub = $event"
      />
      <NuxtLink to="/flights/new" class="btn">+ 新規登録</NuxtLink>
    </div>
  </div>

  <div class="page-body">
    <div class="meta">
      <span class="meta-jp">
        {{ filtered.length }}件 · 合計 {{ totalPP.toLocaleString() }} PP
      </span>
      <span class="meta-jp">搭乗日の新しい順</span>
    </div>
    <hr class="divider-thick" />
    <FlightTable :flights="filtered" />
    <p v-if="filtered.length === 0" class="empty">
      条件に合うフライトがありません。フィルターを変更するか、新しいフライトを登録してください。
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
.controls {
  display: flex;
  gap: 16px;
  align-items: end;
  flex-wrap: wrap;
}
.subhead-jp {
  font-size: 12px;
  color: var(--ink-mute);
  letter-spacing: 0.04em;
  margin-bottom: 4px;
}
.meta {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 12px;
  flex-wrap: wrap;
  gap: 8px;
}
.meta-jp {
  font-size: 12px;
  color: var(--ink-mute);
  letter-spacing: 0.04em;
}
.empty {
  margin-top: 24px;
  font-size: 12.5px;
  color: var(--ink-mute);
  line-height: 1.7;
}
</style>
