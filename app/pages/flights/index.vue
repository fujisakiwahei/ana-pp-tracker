<script setup lang="ts">
import type { AirportCode, CabinClass } from "~~/shared/routes";
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

const { list } = useFlights();
const { data, refresh } = await useAsyncData(
  "flights-list",
  () => list({ year: year.value, limit: 500 }),
  { watch: [year] },
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
      <div class="eyebrow">Flight log · {{ year }}</div>
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
      <span class="eyebrow">
        {{ filtered.length }} flights · {{ totalPP.toLocaleString() }} PP
      </span>
      <span class="eyebrow">Sorted by date · descending</span>
    </div>
    <hr class="divider-thick" />
    <FlightTable :flights="filtered" />
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
.meta {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 12px;
  flex-wrap: wrap;
  gap: 8px;
}
</style>
