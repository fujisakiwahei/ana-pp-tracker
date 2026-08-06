<script setup lang="ts">
import {
  CABIN_OPTIONS,
  HUB_AIRPORT_CODES,
  type AirportCode,
  type CabinClass,
} from "~~/shared/routes";
import { AIRPORTS } from "~~/shared/airports";
import type { FlightStatus } from "~~/shared/schema";

const props = defineProps<{
  year: number;
  cabin: CabinClass | "all";
  hub: AirportCode | "all";
  status: FlightStatus | "all";
  yearOptions: number[];
}>();
const emit = defineEmits<{
  "update:year": [v: number];
  "update:cabin": [v: CabinClass | "all"];
  "update:hub": [v: AirportCode | "all"];
  "update:status": [v: FlightStatus | "all"];
}>();
</script>

<template>
  <div class="filters">
    <div class="field">
      <label class="field-label" for="filter-year">年</label>
      <select
        id="filter-year"
        class="select"
        :value="props.year"
        @change="emit('update:year', Number(($event.target as HTMLSelectElement).value))"
      >
        <option v-for="y in props.yearOptions" :key="y" :value="y">{{ y }}年</option>
      </select>
    </div>
    <div class="field">
      <label class="field-label" for="filter-cabin">クラス</label>
      <select
        id="filter-cabin"
        class="select"
        :value="props.cabin"
        @change="emit('update:cabin', ($event.target as HTMLSelectElement).value as any)"
      >
        <option value="all">すべて</option>
        <option v-for="o in CABIN_OPTIONS" :key="o.value" :value="o.value">{{ o.label }}</option>
      </select>
    </div>
    <div class="field">
      <label class="field-label" for="filter-status">ステータス</label>
      <select
        id="filter-status"
        class="select"
        :value="props.status"
        @change="emit('update:status', ($event.target as HTMLSelectElement).value as any)"
      >
        <option value="all">すべて</option>
        <option value="confirmed">確定・搭乗済み</option>
        <option value="tentative">未予約</option>
      </select>
    </div>
    <div class="field">
      <label class="field-label" for="filter-hub">経由空港</label>
      <select
        id="filter-hub"
        class="select"
        :value="props.hub"
        @change="emit('update:hub', ($event.target as HTMLSelectElement).value as any)"
      >
        <option value="all">すべて</option>
        <option v-for="h in HUB_AIRPORT_CODES" :key="h" :value="h">
          {{ AIRPORTS[h].name }}({{ h }})
        </option>
      </select>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.filters {
  display: flex;
  gap: 16px;
  align-items: center;
  flex-wrap: wrap;
}
.field {
  width: 130px;
}
</style>
