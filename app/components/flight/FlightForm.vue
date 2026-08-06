<script setup lang="ts">
import { toTypedSchema } from "@vee-validate/zod";
import FlightReturnPanel from "./FlightReturnPanel.vue";
import { flightInputSchema, type FlightCreateInput, type FlightInput } from "~~/shared/schema";
import type { AirportCode, CabinClass, FareType } from "~~/shared/routes";
import { todayISO } from "~~/shared/pp";
import { resolvePPTotals } from "~~/app/utils/ppTotals";

const props = defineProps<{
  initialValues?: Partial<FlightInput>;
  submitLabel?: string;
  busy?: boolean;
  showDelete?: boolean;
  enableRoundTrip?: boolean;
}>();
const emit = defineEmits<{
  submit: [v: FlightCreateInput];
  cancel: [];
  delete: [];
}>();

const { handleSubmit, values, resetForm } = useForm<FlightInput>({
  validationSchema: toTypedSchema(flightInputSchema),
  initialValues: {
    flown_at: todayISO(),
    flight_number: "",
    from_airport: "HND",
    to_airport: "OKA",
    cabin: "first",
    fare_type: "simple",
    status: "tentative",
    pp: undefined,
    aircraft: "",
    seat: "",
    lounge: "",
    rating_seat: undefined,
    rating_aircraft: undefined,
    rating_lounge: undefined,
    notes: "",
    ...(props.initialValues ?? {}),
  },
});

watch(
  () => props.initialValues,
  (v) => {
    if (v) resetForm({ values: { ...values, ...v } as FlightInput });
  }
);

const isRoundTrip = ref(false);
const isRoundTripActive = computed(() => !!props.enableRoundTrip && isRoundTrip.value);

// 復路パネルは v-if で出し入れするので、OFF にすると入力値も一緒に破棄される。
// (以前は clearReturnFlight() で ref を1つずつ手で消していた)
const returnPanel = useTemplateRef<InstanceType<typeof FlightReturnPanel>>("returnPanel");
const inboundPP = ref(0);
watch(isRoundTripActive, (on) => {
  if (!on) inboundPP.value = 0;
});

// 入力欄そのものは FlightFields / FlightPPSidebar が useFormContext() 経由で
// この useForm にぶら下がる。ここでは values を読むだけにする。
//
// ※ 同じパスに対して親子で defineField() を呼ぶと、独立したモデル ref が
//   2つできて互いに値を上書きし合い、入力が反映されなくなる。読み取りは
//   必ず values 経由にすること。
const fromCode = computed(() => values.from_airport as AirportCode | undefined);
const toCode = computed(() => values.to_airport as AirportCode | undefined);
const cabinValue = computed(() => values.cabin as CabinClass);
const fareTypeValue = computed(() => values.fare_type as FareType | undefined);
const flownAtValue = computed(() => values.flown_at as string | undefined);

const {
  breakdown,
  pp: autoPP,
  isNewEra,
} = usePPCalc(fromCode, toCode, cabinValue, fareTypeValue, flownAtValue);

/** 表示にも達成率にも、この1つの計算結果だけを使う。 */
const totals = computed(() =>
  resolvePPTotals({
    outboundAuto: autoPP.value,
    outboundOverride: values.pp == null || `${values.pp}` === "" ? null : Number(values.pp),
    isRoundTrip: isRoundTripActive.value,
    inboundPP: inboundPP.value,
  })
);

const onSubmit = handleSubmit(async (v) => {
  // 二重送信ガード: 検証が非同期なため :disabled="busy" だけでは
  // 連続クリックの隙間で送信が二重に走りうる（往復だと2×2=4件）。
  if (props.busy) return;

  if (!isRoundTripActive.value) {
    emit("submit", v);
    return;
  }

  // 復路も同じ vee-validate + Zod で検証する。
  // 通らなければパネル側にフィールド単位のエラーが出るので、ここでは送信を止めるだけ。
  const returnFlight = await returnPanel.value?.validateAndGet();
  if (!returnFlight) return;

  emit("submit", { ...v, round_trip: true, return_flight: returnFlight });
});
</script>

<template>
  <form class="flight-form" @submit="onSubmit">
    <div class="cols">
      <div class="main">
        <FlightFields />

        <fieldset v-if="enableRoundTrip" class="round-trip-section">
          <legend class="legend-jp">往復オプション</legend>
          <label class="check-row">
            <input v-model="isRoundTrip" type="checkbox" :disabled="busy" />
            <span>往復にする</span>
          </label>

          <FlightReturnPanel
            v-if="isRoundTrip"
            ref="returnPanel"
            :from="fromCode"
            :to="toCode"
            :fare-type="fareTypeValue"
            :outbound-flown-at="flownAtValue"
            :default-cabin="cabinValue"
            @update:pp-total="inboundPP = $event"
          />
        </fieldset>

        <div class="actions">
          <button type="submit" class="btn" :disabled="busy">
            {{ submitLabel ?? "記録する" }}
          </button>
          <button type="button" class="btn btn-ghost" @click="emit('cancel')">キャンセル</button>
          <button
            v-if="showDelete"
            type="button"
            class="btn btn-danger delete"
            :disabled="busy"
            @click="emit('delete')"
          >
            削除
          </button>
        </div>
      </div>

      <FlightPPSidebar
        :breakdown="breakdown"
        :is-new-era="isNewEra"
        :from="fromCode"
        :to="toCode"
        :is-round-trip="isRoundTripActive"
        :totals="totals"
      />
    </div>
  </form>
</template>

<style lang="scss" scoped>
.cols {
  display: grid;
  grid-template-columns: 1fr;
  gap: 36px;
  @media (min-width: 1024px) {
    grid-template-columns: 1.4fr 1fr;
    gap: 56px;
  }
}
.main {
  display: flex;
  flex-direction: column;
  gap: 28px;
}
fieldset {
  border: none;
  padding: 0;
  margin: 0;
}
legend.legend-jp {
  font-size: 16px;
  font-weight: 500;
  color: var(--ink-soft);
  letter-spacing: 0.04em;
  margin-bottom: 14px;
  padding-bottom: 6px;
  border-bottom: 1px solid var(--line);
  width: 100%;
}
.round-trip-section {
  padding-top: 4px;
}
.check-row {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  color: var(--ink-soft);
  cursor: pointer;
}
.check-row input {
  width: 18px;
  height: 18px;
  accent-color: var(--accent);
}
.actions {
  display: flex;
  gap: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--line);
  flex-wrap: wrap;
}
.delete {
  margin-left: auto;
}
</style>
