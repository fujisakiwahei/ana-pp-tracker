<script setup lang="ts">
import type { FlightCreateInput } from "~~/shared/schema";

const { create } = useFlights();
const busy = ref(false);
const error = ref("");

async function onSubmit(values: FlightCreateInput) {
  busy.value = true;
  error.value = "";
  try {
    await create(values);
    await navigateTo("/flights");
  } catch (e) {
    error.value = toErrorMessage(e, "保存に失敗しました");
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
      <div class="subhead-jp">新規登録</div>
      <h1 class="section-title page-title">フライトを記録</h1>
    </div>
    <NuxtLink to="/flights" class="btn-link">← 搭乗履歴に戻る</NuxtLink>
  </div>
  <div class="page-body">
    <p class="lede">
      搭乗した路線とクラスから、積算PPが自動で計算されます。手元の運賃と異なる場合のみ「PP」欄に直接入力してください。
    </p>
    <p v-if="error" class="error mono">{{ error }}</p>
    <FlightForm :busy="busy" enable-round-trip @submit="onSubmit" @cancel="onCancel" />
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
.lede {
  margin: 0 0 28px;
  font-size: 13px;
  color: var(--ink-mute);
  line-height: 1.7;
  max-width: 720px;
}
.error {
  color: var(--alert);
  font-size: 12px;
  margin-bottom: 18px;
}
</style>
