<script setup lang="ts">
import type { FlightInput } from "~~/shared/schema";

const { create } = useFlights();
const busy = ref(false);
const error = ref("");

async function onSubmit(values: FlightInput) {
  busy.value = true;
  error.value = "";
  try {
    await create(values);
    await navigateTo("/flights");
  } catch (e: any) {
    error.value = e?.statusMessage ?? e?.message ?? "保存に失敗しました";
  } finally {
    busy.value = false;
  }
}

function onCancel() {
  navigateTo("/flights");
}
</script>

<template>
  <div class="subheader">
    <div>
      <div class="eyebrow">Log a flight · New entry</div>
      <h1 class="section-title page-title">フライトを記録</h1>
    </div>
    <NuxtLink to="/flights" class="btn-link">← FLIGHT LOG</NuxtLink>
  </div>
  <div class="page-body">
    <p v-if="error" class="error mono">{{ error }}</p>
    <FlightForm :busy="busy" @submit="onSubmit" @cancel="onCancel" />
  </div>
</template>

<style lang="scss" scoped>
.page-title {
  font-size: 32px;
  @media (min-width: 768px) {
    font-size: 40px;
  }
}
.error {
  color: var(--alert);
  font-size: 12px;
  margin-bottom: 18px;
}
</style>
