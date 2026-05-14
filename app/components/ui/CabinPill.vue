<script setup lang="ts">
import type { CabinClass } from "~~/shared/routes";

defineProps<{ cabin: CabinClass }>();
</script>

<template>
  <span :class="['pill', cabin === 'first' ? 'gold' : 'economy']">
    {{ cabin === "first" ? "プレミアム" : "エコノミー" }}
  </span>
</template>
