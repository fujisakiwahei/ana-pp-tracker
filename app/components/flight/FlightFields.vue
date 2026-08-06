<script setup lang="ts">
import type { FlightInput } from "~~/shared/schema";
import {
  CABIN_OPTIONS,
  FARE_TYPES,
  FARE_TYPE_LABELS,
  SELECTABLE_AIRPORT_CODES,
} from "~~/shared/routes";
import { AIRPORTS } from "~~/shared/airports";

// 親 (FlightForm.vue) の useForm コンテキストにぶら下がる。
// 往路の入力欄はすべて親の1フォーム = flightInputSchema で検証される。
const { defineField, errors } = useFormContext<FlightInput>();

const [flownAt, flownAtAttrs] = defineField("flown_at");
const [flightNumber, flightNumberAttrs] = defineField("flight_number");
const [fromAirport, fromAirportAttrs] = defineField("from_airport");
const [toAirport, toAirportAttrs] = defineField("to_airport");
const [cabin] = defineField("cabin");
const [status] = defineField("status");
const [fareType, fareTypeAttrs] = defineField("fare_type");
const [aircraft, aircraftAttrs] = defineField("aircraft");
const [seat, seatAttrs] = defineField("seat");
const [lounge, loungeAttrs] = defineField("lounge");
const [ratingSeat] = defineField("rating_seat");
const [ratingAircraft] = defineField("rating_aircraft");
const [ratingLounge] = defineField("rating_lounge");
const [notes, notesAttrs] = defineField("notes");

// 運賃の一覧・表示名は shared/routes.ts が定義元。運賃を増やしても勝手に追従する。
const FARE_OPTIONS = FARE_TYPES.map((value) => ({ value, label: FARE_TYPE_LABELS[value] }));
</script>

<template>
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
        <p v-if="errors.flight_number" class="field-error">{{ errors.flight_number }}</p>
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
          <option v-for="c in SELECTABLE_AIRPORT_CODES" :key="c" :value="c">
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
          <option v-for="c in SELECTABLE_AIRPORT_CODES" :key="c" :value="c">
            {{ c }} · {{ AIRPORTS[c].name }}
          </option>
        </select>
        <p v-if="errors.to_airport" class="field-error">{{ errors.to_airport }}</p>
      </div>
    </div>
    <div class="cabin-row">
      <label class="field-label">クラス<span class="required-mark" aria-hidden="true">*</span></label>
      <Segmented v-model="cabin" :options="CABIN_OPTIONS" />
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
        <p v-if="errors.aircraft" class="field-error">{{ errors.aircraft }}</p>
      </div>
      <div class="field">
        <label class="field-label" for="seat">座席</label>
        <input id="seat" v-model="seat" class="input mono" placeholder="1A" v-bind="seatAttrs" />
        <p v-if="errors.seat" class="field-error">{{ errors.seat }}</p>
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
        <p v-if="errors.lounge" class="field-error">{{ errors.lounge }}</p>
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
      <p v-if="errors.notes" class="field-error">{{ errors.notes }}</p>
    </div>
  </fieldset>
</template>

<style lang="scss" scoped>
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
.field-hint {
  font-family: var(--font-mono);
  font-size: 10.5px;
  color: var(--ink-mute);
  letter-spacing: 0.03em;
  margin-top: 4px;
}
</style>
