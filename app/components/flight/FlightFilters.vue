<script setup lang="ts">
import type { CabinClass, AirportCode } from "~~/shared/routes";

const props = defineProps<{
  year: number;
  cabin: CabinClass | "all";
  hub: AirportCode | "all";
  yearOptions: number[];
}>();
const emit = defineEmits<{
  "update:year": [v: number];
  "update:cabin": [v: CabinClass | "all"];
  "update:hub": [v: AirportCode | "all"];
}>();
</script>

<template>
  <div class="filters">
    <div class="field">
      <label class="field-label">Year</label>
      <select
        class="select"
        :value="props.year"
        @change="emit('update:year', Number(($event.target as HTMLSelectElement).value))"
      >
        <option v-for="y in props.yearOptions" :key="y" :value="y">{{ y }}</option>
      </select>
    </div>
    <div class="field">
      <label class="field-label">Cabin</label>
      <select
        class="select"
        :value="props.cabin"
        @change="emit('update:cabin', ($event.target as HTMLSelectElement).value as any)"
      >
        <option value="all">All</option>
        <option value="economy">Economy</option>
        <option value="first">First</option>
      </select>
    </div>
    <div class="field">
      <label class="field-label">Hub</label>
      <select
        class="select"
        :value="props.hub"
        @change="emit('update:hub', ($event.target as HTMLSelectElement).value as any)"
      >
        <option value="all">All</option>
        <option value="HND">HND</option>
        <option value="FUK">FUK</option>
        <option value="OKA">OKA</option>
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
  width: 100px;
}
</style>
