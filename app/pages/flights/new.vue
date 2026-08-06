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
  <PageHeader eyebrow="新規登録" title="フライトを記録">
    <template #actions>
      <NuxtLink to="/flights" class="btn-link">← 搭乗履歴に戻る</NuxtLink>
    </template>
  </PageHeader>
  <div class="page-body">
    <p class="lede">
      搭乗した路線とクラスから、積算PPが自動で計算されます。手元の運賃と異なる場合のみ「PP」欄に直接入力してください。
    </p>
    <p v-if="error" class="form-error mono">{{ error }}</p>
    <FlightForm :busy="busy" enable-round-trip @submit="onSubmit" @cancel="onCancel" />
  </div>
</template>

<style lang="scss" scoped>
/* 基本は main.scss の .lede。このページだけ少し余白を広く取る。 */
.lede {
  margin-bottom: 28px;
}
</style>
