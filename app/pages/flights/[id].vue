<script setup lang="ts">
import type { FlightCreateInput, FlightInput, FlightRow } from "~~/shared/schema";

const route = useRoute();
const id = String(route.params.id);

const { get, update, remove } = useFlights();
const { data: flight } = await useAsyncData<FlightRow>(`flight-${id}`, () => get(id));

const busy = ref(false);
const error = ref("");

const initial = computed<Partial<FlightInput> | undefined>(() => {
  const f = flight.value;
  if (!f) return undefined;
  return {
    flown_at: f.flown_at,
    flight_number: f.flight_number ?? "",
    from_airport: f.from_airport,
    to_airport: f.to_airport,
    cabin: f.cabin,
    fare_type: f.fare_type ?? undefined,
    status: f.status,
    pp: f.pp,
    aircraft: f.aircraft ?? "",
    seat: f.seat ?? "",
    lounge: f.lounge ?? "",
    rating_seat: f.rating_seat ?? undefined,
    rating_aircraft: f.rating_aircraft ?? undefined,
    rating_lounge: f.rating_lounge ?? undefined,
    notes: f.notes ?? "",
  };
});

async function onSubmit(values: FlightCreateInput) {
  busy.value = true;
  error.value = "";
  try {
    await update(id, values);
    await navigateTo("/flights");
  } catch (e) {
    error.value = toErrorMessage(e, "保存に失敗しました");
  } finally {
    busy.value = false;
  }
}

async function onDelete() {
  if (!confirm("このフライトを削除しますか?")) return;
  busy.value = true;
  try {
    await remove(id);
    await navigateTo("/flights");
  } catch (e) {
    error.value = toErrorMessage(e, "削除に失敗しました");
  } finally {
    busy.value = false;
  }
}

function onCancel() {
  navigateTo("/flights");
}
</script>

<template>
  <PageHeader :eyebrow="`編集 · ${flight?.flight_number ?? id.slice(0, 8)}`" title="フライトを編集">
    <template #actions>
      <NuxtLink to="/flights" class="btn-link">← 搭乗履歴に戻る</NuxtLink>
    </template>
  </PageHeader>
  <div class="page-body">
    <p v-if="error" class="form-error mono">{{ error }}</p>
    <FlightForm
      v-if="initial"
      :initial-values="initial"
      :busy="busy"
      submit-label="保存する"
      show-delete
      @submit="onSubmit"
      @cancel="onCancel"
      @delete="onDelete"
    />
  </div>
</template>

<style lang="scss" scoped>
</style>
