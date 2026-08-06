<script setup lang="ts">
import type { FlightInput } from "~~/shared/schema";
import type { PPBreakdown } from "~~/shared/pp";
import { DOMESTIC_ROUTE_MULTIPLIER, GOAL_PP } from "~~/shared/pp";
import type { FlightPPTotals } from "~~/app/utils/ppTotals";

const props = defineProps<{
  breakdown: PPBreakdown | null;
  isNewEra: boolean;
  from: string | undefined;
  to: string | undefined;
  isRoundTrip: boolean;
  /** 記録時に加算されるPP。親が resolvePPTotals() で1度だけ計算した値。 */
  totals: FlightPPTotals;
}>();

// PP手入力の上書き欄は親フォームのフィールド。
const { defineField, errors } = useFormContext<FlightInput>();
const [pp, ppAttrs] = defineField("pp");

const summary = useFetch<{ confirmedPP: number; goalPP: number }>("/api/stats/summary", {
  lazy: true,
  default: () => ({ confirmedPP: 0, goalPP: GOAL_PP }),
});

const goalPP = computed(() => summary.data.value?.goalPP ?? GOAL_PP);
const projectedTotal = computed(() => (summary.data.value?.confirmedPP ?? 0) + props.totals.added);
const projectedPct = computed(() => (props.totals.added / goalPP.value) * 100);
</script>

<template>
  <aside class="side">
    <div class="card pp-card">
      <div class="card-sub">自動計算</div>
      <div class="card-title display italic">今回の搭乗で加算されるPP</div>
      <div class="big">
        <span class="num mono">{{ totals.added.toLocaleString() }}</span>
        <span class="unit display italic">PP</span>
      </div>
      <div v-if="isRoundTrip" class="pp-split mono">
        往路 {{ totals.outbound.toLocaleString() }} + 復路 {{ totals.inbound.toLocaleString() }}
      </div>
      <hr class="divider" />
      <table>
        <tbody>
          <tr>
            <td class="lbl">区間</td>
            <td class="val">{{ from }} → {{ to }}</td>
          </tr>
          <tr>
            <td class="lbl">基本マイル</td>
            <td class="val">{{ breakdown?.baseMiles?.toLocaleString() ?? "—" }}</td>
          </tr>
          <tr>
            <td class="lbl">積算率</td>
            <td class="val">{{ breakdown ? `${breakdown.rate}%` : "—" }}</td>
          </tr>
          <tr>
            <td class="lbl">路線倍率</td>
            <td class="val">×{{ breakdown?.multiplier ?? DOMESTIC_ROUTE_MULTIPLIER }}</td>
          </tr>
          <tr>
            <td class="lbl">搭乗ポイント</td>
            <td class="val">+{{ breakdown?.boarding ?? 0 }}</td>
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
          :placeholder="String(breakdown?.total ?? 0)"
          v-bind="ppAttrs"
        />
        <p v-if="errors.pp" class="field-error">{{ errors.pp }}</p>
      </div>
    </div>

    <div class="projected">
      <div>
        <div class="projected-label">記録した後の累計</div>
        <div class="mono total">
          {{ projectedTotal.toLocaleString() }} / {{ goalPP.toLocaleString() }} PP
        </div>
      </div>
      <div class="mono delta">達成率 +{{ projectedPct.toFixed(1) }}%</div>
    </div>
  </aside>
</template>

<style lang="scss" scoped>
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
.card-sub {
  font-size: 11px;
  color: var(--ink-mute);
  letter-spacing: 0.04em;
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
.projected-label {
  font-size: 11px;
  color: var(--ink-mute);
  letter-spacing: 0.04em;
  margin-bottom: 6px;
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
