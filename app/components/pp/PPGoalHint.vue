<script setup lang="ts">
import type { Suggestion } from "~~/shared/pp";
import { AIRPORTS } from "~~/shared/airports";

const props = defineProps<{ suggestion: Suggestion }>();
</script>

<template>
  <div class="hint">
    <header>
      <RouteCodeBadge :from="props.suggestion.from" :to="props.suggestion.to" />
      <CabinPill :cabin="props.suggestion.cabin" />
    </header>
    <div class="sub">
      {{ AIRPORTS[props.suggestion.from].name }} ⇄ {{ AIRPORTS[props.suggestion.to].name }}
    </div>
    <div class="big">
      <span class="num mono">{{ props.suggestion.roundTripsNeeded }}</span>
      <span class="unit display italic">往復</span>
    </div>
    <div class="caption mono">
      {{ props.suggestion.ppRoundTrip.toLocaleString() }} PP / round-trip
    </div>
  </div>
</template>

<style lang="scss" scoped>
.hint {
  padding: 24px 22px 22px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.sub {
  color: var(--ink-mute);
  font-size: 11.5px;
}
.big {
  display: flex;
  align-items: baseline;
  gap: 6px;
  margin-top: 4px;
}
.num {
  font-size: 54px;
  font-weight: 300;
  letter-spacing: -0.02em;
  line-height: 1;
  color: var(--ana-blue);
}
.unit {
  font-size: 22px;
  color: var(--ink-mute);
}
.caption {
  font-size: 10.5px;
  letter-spacing: 0.1em;
  color: var(--ink-mute);
  text-transform: uppercase;
}
</style>
