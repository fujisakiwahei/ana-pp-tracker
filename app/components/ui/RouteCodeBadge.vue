<script setup lang="ts">
import type { AirportCode } from "~~/shared/routes";

const props = defineProps<{
  from: AirportCode;
  to: AirportCode;
  big?: boolean;
}>();
</script>

<template>
  <span class="route-code" :class="{ big: props.big }">
    <span>{{ from }}</span>
    <span class="arrow">→</span>
    <span>{{ to }}</span>
  </span>
</template>

<style lang="scss" scoped>
.route-code {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-family: var(--font-mono);
  font-size: 14px;
  letter-spacing: 0.05em;
}
.route-code.big {
  gap: 14px;
  font-size: 24px;
}
.arrow {
  opacity: 0.5;
  font-size: 11px;
}
.route-code.big .arrow {
  font-size: 18px;
}
</style>
