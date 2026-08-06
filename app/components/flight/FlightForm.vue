<script setup lang="ts">
import { toTypedSchema } from "@vee-validate/zod";
import {
  flightInputSchema,
  type FlightCreateInput,
  type FlightInput,
  type ReturnFlightInput,
} from "~~/shared/schema";
import type { AirportCode, CabinClass, FareType } from "~~/shared/routes";
import { AIRPORTS, AIRPORT_CODES } from "~~/shared/airports";

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

const today = new Date().toISOString().slice(0, 10);

const { handleSubmit, values, errors, defineField, resetForm } = useForm<FlightInput>({
  validationSchema: toTypedSchema(flightInputSchema),
  initialValues: {
    flown_at: today,
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

const [flownAt, flownAtAttrs] = defineField("flown_at");
const [flightNumber, flightNumberAttrs] = defineField("flight_number");
const [fromAirport, fromAirportAttrs] = defineField("from_airport");
const [toAirport, toAirportAttrs] = defineField("to_airport");
const [cabin] = defineField("cabin");
const [status] = defineField("status");
const [fareType, fareTypeAttrs] = defineField("fare_type");
const [pp, ppAttrs] = defineField("pp");
const [aircraft, aircraftAttrs] = defineField("aircraft");
const [seat, seatAttrs] = defineField("seat");
const [lounge, loungeAttrs] = defineField("lounge");
const [ratingSeat] = defineField("rating_seat");
const [ratingAircraft] = defineField("rating_aircraft");
const [ratingLounge] = defineField("rating_lounge");
const [notes, notesAttrs] = defineField("notes");

const isRoundTrip = ref(false);
const returnFlownAt = ref("");
const returnFlightNumber = ref("");
const returnCabin = ref<CabinClass>("first");
const returnPP = ref("");
const returnAircraft = ref("");
const returnSeat = ref("");
const returnLounge = ref("");
const returnNotes = ref("");
const roundTripError = ref("");

function clearReturnFlight() {
  returnFlownAt.value = "";
  returnFlightNumber.value = "";
  returnPP.value = "";
  returnAircraft.value = "";
  returnSeat.value = "";
  returnLounge.value = "";
  returnNotes.value = "";
  roundTripError.value = "";
}

watch(isRoundTrip, (enabled) => {
  if (enabled) {
    // 復路クラスの初期値は往路に合わせる（以降は独立して変更可能）
    returnCabin.value = cabin.value as CabinClass;
  } else {
    clearReturnFlight();
  }
});

const {
  route,
  pp: autoPP,
  isNewEra,
} = usePPCalc(
  () => fromAirport.value as AirportCode | undefined,
  () => toAirport.value as AirportCode | undefined,
  () => cabin.value as CabinClass | undefined,
  () => fareType.value as FareType | undefined,
  () => flownAt.value as string | undefined
);

// 復路（区間を逆にして計算。クラスは復路用に独立、復路日が未入力なら往路日で代用）
const { pp: returnAutoPP } = usePPCalc(
  () => toAirport.value as AirportCode | undefined,
  () => fromAirport.value as AirportCode | undefined,
  () => returnCabin.value,
  () => fareType.value as FareType | undefined,
  () => (returnFlownAt.value || flownAt.value) as string | undefined
);

const isRoundTripActive = computed(() => !!props.enableRoundTrip && isRoundTrip.value);
const outboundPP = computed(() => autoPP.value ?? 0);
const returnPPDisplay = computed(() => {
  if (returnPP.value !== "") {
    const n = Number(returnPP.value);
    if (Number.isFinite(n)) return n;
  }
  return returnAutoPP.value ?? 0;
});
const ppDisplay = computed(() =>
  isRoundTripActive.value ? outboundPP.value + returnPPDisplay.value : outboundPP.value
);
const summary = useFetch<{ confirmedPP: number; goalPP: number }>("/api/stats/summary", {
  lazy: true,
  default: () => ({ confirmedPP: 0, goalPP: 50000 }),
});

// 記録時に加算される実効PP（往路は手入力上書きを優先、往復なら復路も加算）
const addedPP = computed(() => {
  const out = pp.value ?? autoPP.value ?? 0;
  return isRoundTripActive.value ? out + returnPPDisplay.value : out;
});
const projectedTotal = computed(() => {
  const t = summary.data.value?.confirmedPP ?? 0;
  return t + addedPP.value;
});
const projectedPct = computed(() => {
  const goal = summary.data.value?.goalPP ?? 50000;
  return (addedPP.value / goal) * 100;
});

const FARE_OPTIONS = [
  { value: "flex", label: "フレックス" },
  { value: "biz", label: "ビジネスきっぷ / Biz" },
  { value: "standard", label: "スタンダード" },
  { value: "simple", label: "シンプル" },
  { value: "sale", label: "セール運賃" },
  { value: "ana_card", label: "ANAカード優待割引" },
  { value: "stockholder", label: "株主優待割引" },
  { value: "shimin", label: "島民割引" },
];

// 表示用: 選択中の運賃 × クラス × 搭乗日 から積算率と搭乗ポイントを逆算
const fareBreakdown = computed(() => {
  const miles = route.value?.baseMiles ?? 0;
  const auto = autoPP.value;
  if (!miles || auto == null) return { rate: "—", bonus: 0 };
  // 全運賃の搭乗ポイントは 0/100/200/400 のいずれか。autoPP から逆算する。
  const candidates = [0, 100, 200, 400];
  for (const bonus of candidates) {
    const accrued = auto - bonus;
    if (accrued < 0) continue;
    const ratePct = (accrued / (miles * 2)) * 100;
    const rounded = Math.round(ratePct);
    if (Math.abs(rounded - ratePct) < 0.6 && rounded >= 30 && rounded <= 150) {
      return { rate: `${rounded}%`, bonus };
    }
  }
  return { rate: "—", bonus: 0 };
});

const onSubmit = handleSubmit((v) => {
  // 二重送信ガード: 検証が非同期なため :disabled="busy" だけでは
  // 連続クリックの隙間で送信が二重に走りうる（往復だと2×2=4件）。
  if (props.busy) return;

  if (!props.enableRoundTrip || !isRoundTrip.value) {
    emit("submit", v);
    return;
  }

  if (!returnFlownAt.value) {
    roundTripError.value = "帰りの搭乗日を入力してください";
    return;
  }

  const returnFlight: ReturnFlightInput = {
    flown_at: returnFlownAt.value,
    flight_number: returnFlightNumber.value,
    cabin: returnCabin.value,
    pp: returnPP.value === "" ? undefined : Number(returnPP.value),
    aircraft: returnAircraft.value,
    seat: returnSeat.value,
    lounge: returnLounge.value,
    notes: returnNotes.value,
  };

  roundTripError.value = "";
  emit("submit", {
    ...v,
    round_trip: true,
    return_flight: returnFlight,
  });
});
</script>

<template>
  <form class="flight-form" @submit="onSubmit">
    <div class="cols">
      <div class="main">
        <fieldset class="status-section">
          <legend class="legend-jp">ステータス</legend>
          <div class="status-row">
            <Segmented
              v-model="status"
              :options="[
                { value: 'confirmed', label: '搭乗確定' },
                { value: 'tentative', label: '未予約' },
              ]"
            />
            <p class="status-hint" :class="{ tentative: status === 'tentative' }">
              {{
                status === "tentative"
                  ? "未予約：見込みPPとして別枠で集計（目標達成には未カウント）"
                  : "搭乗確定：確定PPとして目標達成にカウント"
              }}
            </p>
          </div>
        </fieldset>

        <fieldset>
          <legend class="legend-jp">搭乗日と便</legend>
          <div class="grid-3">
            <div class="field">
              <label class="field-label" for="flown-at"
                >搭乗日<span class="required-mark" aria-hidden="true">*</span></label
              >
              <input
                id="flown-at"
                v-model="flownAt"
                class="input mono"
                type="date"
                v-bind="flownAtAttrs"
                aria-describedby="flown-at-hint"
                required
              />
              <p id="flown-at-hint" class="field-hint">数字を打つと年→月→日へ自動で進みます</p>
              <p v-if="errors.flown_at" class="field-error">{{ errors.flown_at }}</p>
            </div>
            <div class="field">
              <label class="field-label" for="flight-number">便名</label>
              <input
                id="flight-number"
                v-model="flightNumber"
                class="input mono"
                placeholder="NH256"
                v-bind="flightNumberAttrs"
              />
            </div>
            <div class="field">
              <label class="field-label" for="fare-type">運賃種別</label>
              <select id="fare-type" v-model="fareType" class="select" v-bind="fareTypeAttrs">
                <option value="">—</option>
                <option v-for="o in FARE_OPTIONS" :key="o.value" :value="o.value">
                  {{ o.label }}
                </option>
              </select>
            </div>
          </div>
        </fieldset>

        <fieldset>
          <legend class="legend-jp">区間とクラス</legend>
          <div class="grid-route">
            <div class="field">
              <label class="field-label" for="from-airport"
                >出発<span class="required-mark" aria-hidden="true">*</span></label
              >
              <select
                id="from-airport"
                v-model="fromAirport"
                class="select"
                v-bind="fromAirportAttrs"
                required
              >
                <option v-for="c in AIRPORT_CODES" :key="c" :value="c">
                  {{ c }} · {{ AIRPORTS[c].name }}
                </option>
              </select>
              <p v-if="errors.from_airport" class="field-error">{{ errors.from_airport }}</p>
            </div>
            <span class="arrow">→</span>
            <div class="field">
              <label class="field-label" for="to-airport"
                >到着<span class="required-mark" aria-hidden="true">*</span></label
              >
              <select
                id="to-airport"
                v-model="toAirport"
                class="select"
                v-bind="toAirportAttrs"
                required
              >
                <option v-for="c in AIRPORT_CODES" :key="c" :value="c">
                  {{ c }} · {{ AIRPORTS[c].name }}
                </option>
              </select>
              <p v-if="errors.to_airport" class="field-error">{{ errors.to_airport }}</p>
            </div>
          </div>
          <div class="cabin-row">
            <label class="field-label"
              >クラス<span class="required-mark" aria-hidden="true">*</span></label
            >
            <Segmented
              v-model="cabin"
              :options="[
                { value: 'economy', label: 'エコノミー' },
                { value: 'first', label: 'プレミアム' },
              ]"
            />
          </div>
        </fieldset>

        <fieldset>
          <legend class="legend-jp">機材と座席(任意)</legend>
          <div class="grid-3">
            <div class="field">
              <label class="field-label" for="aircraft">機体</label>
              <input
                id="aircraft"
                v-model="aircraft"
                class="input"
                placeholder="B787-9"
                v-bind="aircraftAttrs"
              />
            </div>
            <div class="field">
              <label class="field-label" for="seat">座席</label>
              <input
                id="seat"
                v-model="seat"
                class="input mono"
                placeholder="1A"
                v-bind="seatAttrs"
              />
            </div>
            <div class="field">
              <label class="field-label" for="lounge">ラウンジ</label>
              <input
                id="lounge"
                v-model="lounge"
                class="input"
                placeholder="ANA LOUNGE 羽田"
                v-bind="loungeAttrs"
              />
            </div>
          </div>
        </fieldset>

        <fieldset>
          <legend class="legend-jp">感想(任意)</legend>
          <div class="grid-3 ratings">
            <div class="field">
              <label class="field-label">座席</label>
              <RatingStars
                interactive
                :value="ratingSeat ?? null"
                @update:value="(v: number | null) => (ratingSeat = v ?? undefined)"
              />
            </div>
            <div class="field">
              <label class="field-label">機体</label>
              <RatingStars
                interactive
                :value="ratingAircraft ?? null"
                @update:value="(v: number | null) => (ratingAircraft = v ?? undefined)"
              />
            </div>
            <div class="field">
              <label class="field-label">ラウンジ</label>
              <RatingStars
                interactive
                :value="ratingLounge ?? null"
                @update:value="(v: number | null) => (ratingLounge = v ?? undefined)"
              />
            </div>
          </div>
          <div class="field memo">
            <label class="field-label" for="notes">メモ</label>
            <textarea
              id="notes"
              v-model="notes"
              class="textarea"
              placeholder="搭乗の振り返り、機内サービスの感想など"
              v-bind="notesAttrs"
            />
          </div>
        </fieldset>

        <fieldset v-if="enableRoundTrip" class="round-trip-section">
          <legend class="legend-jp">往復オプション</legend>
          <label class="check-row">
            <input v-model="isRoundTrip" type="checkbox" :disabled="busy" />
            <span>往復にする</span>
          </label>

          <div v-if="isRoundTrip" class="return-panel">
            <div class="route-preview mono">{{ toAirport }} → {{ fromAirport }}</div>
            <div class="cabin-row">
              <label class="field-label">帰りのクラス</label>
              <Segmented
                v-model="returnCabin"
                :options="[
                  { value: 'economy', label: 'エコノミー' },
                  { value: 'first', label: 'プレミアム' },
                ]"
              />
            </div>
            <div class="grid-3">
              <div class="field">
                <label class="field-label" for="return-flown-at"
                  >帰りの搭乗日<span class="required-mark" aria-hidden="true">*</span></label
                >
                <input
                  id="return-flown-at"
                  v-model="returnFlownAt"
                  class="input mono"
                  type="date"
                  required
                />
              </div>
              <div class="field">
                <label class="field-label" for="return-flight-number">帰りの便名</label>
                <input
                  id="return-flight-number"
                  v-model="returnFlightNumber"
                  class="input mono"
                  placeholder="NH255"
                />
              </div>
              <div class="field">
                <label class="field-label" for="return-pp">復路PP(手入力で上書き)</label>
                <input
                  id="return-pp"
                  v-model="returnPP"
                  class="input mono"
                  type="number"
                  :placeholder="String(returnAutoPP ?? 0)"
                />
              </div>
            </div>
            <div class="grid-3 return-optional">
              <div class="field">
                <label class="field-label" for="return-aircraft">帰りの機体</label>
                <input
                  id="return-aircraft"
                  v-model="returnAircraft"
                  class="input"
                  placeholder="B787-9"
                />
              </div>
              <div class="field">
                <label class="field-label" for="return-seat">帰りの座席</label>
                <input id="return-seat" v-model="returnSeat" class="input mono" placeholder="1A" />
              </div>
              <div class="field">
                <label class="field-label" for="return-lounge">帰りのラウンジ</label>
                <input
                  id="return-lounge"
                  v-model="returnLounge"
                  class="input"
                  placeholder="ANA LOUNGE 那覇"
                />
              </div>
            </div>
            <div class="field memo">
              <label class="field-label" for="return-notes">帰りのメモ</label>
              <textarea
                id="return-notes"
                v-model="returnNotes"
                class="textarea"
                placeholder="復路の振り返り、機内サービスの感想など"
              />
            </div>
            <p v-if="roundTripError" class="field-error">{{ roundTripError }}</p>
          </div>
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

      <aside class="side">
        <div class="card pp-card">
          <div class="card-sub">自動計算</div>
          <div class="card-title display italic">今回の搭乗で加算されるPP</div>
          <div class="big">
            <span class="num mono">{{ ppDisplay.toLocaleString() }}</span>
            <span class="unit display italic">PP</span>
          </div>
          <div v-if="isRoundTripActive" class="pp-split mono">
            往路 {{ outboundPP.toLocaleString() }} + 復路 {{ returnPPDisplay.toLocaleString() }}
          </div>
          <hr class="divider" />
          <table>
            <tbody>
              <tr>
                <td class="lbl">区間</td>
                <td class="val">{{ fromAirport }} → {{ toAirport }}</td>
              </tr>
              <tr>
                <td class="lbl">基本マイル</td>
                <td class="val">{{ route?.baseMiles?.toLocaleString() ?? "—" }}</td>
              </tr>
              <tr>
                <td class="lbl">積算率</td>
                <td class="val">{{ fareBreakdown.rate }}</td>
              </tr>
              <tr>
                <td class="lbl">路線倍率</td>
                <td class="val">×2</td>
              </tr>
              <tr>
                <td class="lbl">搭乗ポイント</td>
                <td class="val">+{{ fareBreakdown.bonus }}</td>
              </tr>
              <tr>
                <td class="lbl">運賃体系</td>
                <td class="val">{{ isNewEra ? "新 (2026/5/19〜)" : "旧 (〜2026/5/18)" }}</td>
              </tr>
            </tbody>
          </table>
          <p class="note">
            搭乗日・クラス・運賃種別から積算PPを計算しています。実績と差がある場合は下の欄に実際のPPを入力して上書きできます。
          </p>
          <div class="field override">
            <label class="field-label" for="pp-override">PP(手入力で上書き)</label>
            <input
              id="pp-override"
              v-model="pp"
              class="input mono"
              type="number"
              :placeholder="String(outboundPP)"
              v-bind="ppAttrs"
            />
            <p v-if="errors.pp" class="field-error">{{ errors.pp }}</p>
          </div>
        </div>

        <div class="projected">
          <div>
            <div class="projected-label">記録した後の累計</div>
            <div class="mono total">
              {{ projectedTotal.toLocaleString() }} /
              {{ (summary.data.value?.goalPP ?? 50000).toLocaleString() }} PP
            </div>
          </div>
          <div class="mono delta">達成率 +{{ projectedPct.toFixed(1) }}%</div>
        </div>
      </aside>
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
.card-sub {
  font-size: 11px;
  color: var(--ink-mute);
  letter-spacing: 0.04em;
}
.projected-label {
  font-size: 11px;
  color: var(--ink-mute);
  letter-spacing: 0.04em;
  margin-bottom: 6px;
}
.grid-3 {
  display: grid;
  grid-template-columns: 1fr;
  gap: 24px;
  @media (min-width: 600px) {
    grid-template-columns: 1fr 1fr 1fr;
  }
}
.grid-route {
  display: grid;
  grid-template-columns: 1fr 24px 1fr;
  gap: 18px;
  align-items: end;
}
.grid-route .arrow {
  padding-bottom: 12px;
  text-align: center;
  color: var(--ink-mute);
}
.cabin-row {
  margin-top: 22px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
}
.status-row {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}
.status-hint {
  font-size: 11.5px;
  color: var(--ink-soft);
  letter-spacing: 0.03em;
  margin: 0;
}
.status-hint.tentative {
  color: var(--ink-mute);
}
.ratings {
  margin-bottom: 22px;
}
.memo {
  margin-top: 8px;
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
.return-optional {
  margin-top: 18px;
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

.side {
  display: flex;
  flex-direction: column;
  gap: 18px;
  align-self: start;
  position: sticky;
  top: 16px;
}
.pp-card {
  padding: 26px 26px 28px;
}
.card-title {
  font-size: 22px;
  margin-top: 6px;
  color: var(--ink-soft);
}
.big {
  margin-top: 18px;
  display: flex;
  align-items: baseline;
  gap: 8px;
}
.num {
  font-size: 64px;
  font-weight: 300;
  letter-spacing: -0.02em;
  line-height: 1;
}
.unit {
  font-size: 20px;
  color: var(--ink-mute);
}
.pp-split {
  margin-top: 10px;
  font-size: 12px;
  color: var(--ink-mute);
  letter-spacing: 0.04em;
}
.field-hint {
  font-family: var(--font-mono);
  font-size: 10.5px;
  color: var(--ink-mute);
  letter-spacing: 0.03em;
  margin-top: 4px;
}
hr.divider {
  margin: 22px 0;
}
table {
  width: 100%;
  font-family: var(--font-mono);
  font-size: 11.5px;
  letter-spacing: 0.04em;
  border-collapse: collapse;
}
.lbl {
  padding: 5px 0;
  color: var(--ink-mute);
}
.val {
  padding: 5px 0;
  text-align: right;
}
.note {
  margin-top: 16px;
  font-size: 10.5px;
  color: var(--ink-mute);
  line-height: 1.6;
}
.override {
  margin-top: 18px;
}

.projected {
  padding: 18px 22px;
  border: 1px dashed var(--line);
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.total {
  font-size: 18px;
  margin-top: 4px;
}
.delta {
  font-size: 11px;
  color: var(--ink-mute);
  letter-spacing: 0.05em;
}
</style>
