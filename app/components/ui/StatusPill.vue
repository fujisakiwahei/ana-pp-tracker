<script setup lang="ts">
import type { FlightStatus } from "~~/shared/schema";

const props = defineProps<{ status: FlightStatus; flownAt: string }>();

const today = new Date().toISOString().slice(0, 10);

// confirmed は搭乗日が過去なら「搭乗済み」、未来なら「搭乗確定」。tentative は常に「仮予約」。
const kind = computed<"done" | "upcoming" | "tentative">(() => {
  if (props.status === "tentative") return "tentative";
  return props.flownAt < today ? "done" : "upcoming";
});

const label = computed(
  () => ({ done: "搭乗済み", upcoming: "搭乗確定", tentative: "仮予約" })[kind.value]
);
</script>

<template>
  <span class="pill" :class="`status-${kind}`">{{ label }}</span>
</template>
