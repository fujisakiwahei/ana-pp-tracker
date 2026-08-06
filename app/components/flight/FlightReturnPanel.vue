<script setup lang="ts">
import { toTypedSchema } from "@vee-validate/zod";
import { returnFlightInputSchema, type ReturnFlightInput } from "~~/shared/schema";
import { CABIN_OPTIONS, type AirportCode, type CabinClass, type FareType } from "~~/shared/routes";

const props = defineProps<{
  /** 往路の出発地 (復路では到着地になる) */
  from: AirportCode | undefined;
  /** 往路の到着地 (復路では出発地になる) */
  to: AirportCode | undefined;
  /** 運賃種別は往路と共通 */
  fareType: FareType | undefined;
  /** 復路日が未入力のときのPP試算に使う */
  outboundFlownAt: string | undefined;
  /** 復路クラスの初期値 (往路に合わせる。以降は独立して変更可能) */
  defaultCabin: CabinClass;
}>();

const emit = defineEmits<{
  /** 復路の実効PP (手入力があればそれ、無ければ自動計算値) */
  "update:ppTotal": [v: number];
}>();

// 往路と同じ vee-validate + Zod で検証する。
// 以前は素の ref 8個 + 「帰りの搭乗日が空か」の手書きチェック1行だけだったため、
// 便名の文字数超過などはサーバの400を待つまでエラーが出なかった。
const { defineField, errors, validate, values } = useForm<ReturnFlightInput>({
  validationSchema: toTypedSchema(returnFlightInputSchema),
  initialValues: {
    flown_at: "",
    flight_number: "",
    cabin: props.defaultCabin,
    pp: undefined,
    aircraft: "",
    seat: "",
    lounge: "",
    notes: "",
  },
});

const [flownAt, flownAtAttrs] = defineField("flown_at");
const [flightNumber, flightNumberAttrs] = defineField("flight_number");
const [cabin] = defineField("cabin");
const [pp, ppAttrs] = defineField("pp");
const [aircraft, aircraftAttrs] = defineField("aircraft");
const [seat, seatAttrs] = defineField("seat");
const [lounge, loungeAttrs] = defineField("lounge");
const [notes, notesAttrs] = defineField("notes");

// cabin は returnFlightInputSchema 上は任意なので、未設定なら往路のクラスを既定にする。
const cabinModel = computed<CabinClass>({
  get: () => cabin.value ?? props.defaultCabin,
  set: (v) => (cabin.value = v),
});

// 区間を逆にして計算。復路日が未入力なら往路日で代用する。
const { pp: autoPP } = usePPCalc(
  () => props.to,
  () => props.from,
  () => cabinModel.value,
  () => props.fareType,
  () => flownAt.value || props.outboundFlownAt
);

/** 手入力の上書きがあればそれを、無ければ自動計算値を使う。 */
const effectivePP = computed(() => {
  const raw = pp.value;
  if (raw != null && `${raw}` !== "") {
    const n = Number(raw);
    if (Number.isFinite(n)) return n;
  }
  return autoPP.value ?? 0;
});

watch(effectivePP, (v) => emit("update:ppTotal", v), { immediate: true });

/**
 * 復路を検証して値を返す。検証に通らなければ null。
 * 親はこれが null なら送信を中断する。
 */
async function validateAndGet(): Promise<ReturnFlightInput | null> {
  const { valid } = await validate();
  if (!valid) return null;
  const parsed = returnFlightInputSchema.safeParse(values);
  return parsed.success ? parsed.data : null;
}

defineExpose({ validateAndGet });
</script>

<template>
  <div class="return-panel">
    <div class="route-preview mono">{{ to }} → {{ from }}</div>
    <div class="cabin-row">
      <label class="field-label">帰りのクラス</label>
      <Segmented v-model="cabinModel" :options="CABIN_OPTIONS" />
    </div>
    <div class="grid-3">
      <div class="field">
        <label class="field-label" for="return-flown-at"
          >帰りの搭乗日<span class="required-mark" aria-hidden="true">*</span></label
        >
        <input
          id="return-flown-at"
          v-model="flownAt"
          class="input mono"
          type="date"
          v-bind="flownAtAttrs"
          required
        />
        <p v-if="errors.flown_at" class="field-error">{{ errors.flown_at }}</p>
      </div>
      <div class="field">
        <label class="field-label" for="return-flight-number">帰りの便名</label>
        <input
          id="return-flight-number"
          v-model="flightNumber"
          class="input mono"
          placeholder="NH255"
          v-bind="flightNumberAttrs"
        />
        <p v-if="errors.flight_number" class="field-error">{{ errors.flight_number }}</p>
      </div>
      <div class="field">
        <label class="field-label" for="return-pp">復路PP(手入力で上書き)</label>
        <input
          id="return-pp"
          v-model="pp"
          class="input mono"
          type="number"
          :placeholder="String(autoPP ?? 0)"
          v-bind="ppAttrs"
        />
        <p v-if="errors.pp" class="field-error">{{ errors.pp }}</p>
      </div>
    </div>
    <div class="grid-3 return-optional">
      <div class="field">
        <label class="field-label" for="return-aircraft">帰りの機体</label>
        <input
          id="return-aircraft"
          v-model="aircraft"
          class="input"
          placeholder="B787-9"
          v-bind="aircraftAttrs"
        />
        <p v-if="errors.aircraft" class="field-error">{{ errors.aircraft }}</p>
      </div>
      <div class="field">
        <label class="field-label" for="return-seat">帰りの座席</label>
        <input
          id="return-seat"
          v-model="seat"
          class="input mono"
          placeholder="1A"
          v-bind="seatAttrs"
        />
        <p v-if="errors.seat" class="field-error">{{ errors.seat }}</p>
      </div>
      <div class="field">
        <label class="field-label" for="return-lounge">帰りのラウンジ</label>
        <input
          id="return-lounge"
          v-model="lounge"
          class="input"
          placeholder="ANA LOUNGE 那覇"
          v-bind="loungeAttrs"
        />
        <p v-if="errors.lounge" class="field-error">{{ errors.lounge }}</p>
      </div>
    </div>
    <div class="field memo">
      <label class="field-label" for="return-notes">帰りのメモ</label>
      <textarea
        id="return-notes"
        v-model="notes"
        class="textarea"
        placeholder="復路の振り返り、機内サービスの感想など"
        v-bind="notesAttrs"
      />
      <p v-if="errors.notes" class="field-error">{{ errors.notes }}</p>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.return-panel {
  margin-top: 16px;
  padding: 18px;
  border: 1px solid var(--line);
  background: rgba(255, 255, 255, 0.54);
}
.route-preview {
  font-size: 12px;
  color: var(--ink-mute);
  letter-spacing: 0.08em;
  margin-bottom: 16px;
}
.cabin-row {
  margin-top: 22px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
}
.grid-3 {
  display: grid;
  grid-template-columns: 1fr;
  gap: 24px;
  @media (min-width: 600px) {
    grid-template-columns: 1fr 1fr 1fr;
  }
}
.return-optional {
  margin-top: 18px;
}
.memo {
  margin-top: 8px;
}
</style>
