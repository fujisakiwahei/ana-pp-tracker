<script setup lang="ts">
const props = defineProps<{
  confirmedPP: number;
  tentativePP: number;
  goalPP: number;
  remainingPP: number;
  progress: number;
  tentativeProgress: number;
  confirmedCount: number;
  tentativeCount: number;
}>();

// 確定ぶんは実線塗り、仮予約ぶんはその右に薄色で継ぎ足し。
const confirmedPct = computed(() => Math.min(100, props.progress * 100));
const tentativePct = computed(() =>
  Math.max(0, Math.min(100, props.tentativeProgress * 100) - confirmedPct.value)
);
const projectedPP = computed(() => props.confirmedPP + props.tentativePP);
</script>

<template>
  <div class="summary">
    <div class="lbl">今年の確定PP（搭乗済み＋搭乗確定）</div>
    <div class="big">
      <span class="num mono">{{ confirmedPP.toLocaleString() }}</span>
      <span class="goal display italic">/ {{ goalPP.toLocaleString() }}</span>
    </div>
    <div v-if="tentativePP > 0" class="projection mono">
      ＋仮予約 {{ tentativePP.toLocaleString() }} PP
      <span class="arrow">→</span>
      見込み {{ projectedPP.toLocaleString() }} PP
    </div>
    <div class="bar">
      <div class="progress">
        <div class="progress-fill" :style="{ width: `${confirmedPct}%` }" />
        <div
          v-if="tentativePct > 0"
          class="progress-ghost"
          :style="{ left: `${confirmedPct}%`, width: `${tentativePct}%` }"
        />
      </div>
      <div class="ticks">
        <span>0 PP</span>
        <span>達成率 {{ confirmedPct.toFixed(1) }}% · ブロンズ 30,000</span>
        <span>プラチナ 50,000</span>
      </div>
      <div class="legend">
        <span class="key"><i class="sw sw-confirmed" />確定</span>
        <span class="key"><i class="sw sw-tentative" />仮予約（見込み）</span>
      </div>
    </div>
    <div class="metrics">
      <div>
        <div class="lbl">目標まで残り</div>
        <div class="metric">
          <span class="mono">{{ remainingPP.toLocaleString() }}</span
          ><span class="unit">PP</span>
        </div>
      </div>
      <div>
        <div class="lbl">確定 / 仮予約</div>
        <div class="metric">
          <span class="mono">{{ confirmedCount }}</span
          ><span class="unit">便</span><span class="sep">/</span
          ><span class="mono soft">{{ tentativeCount }}</span
          ><span class="unit">便</span>
        </div>
      </div>
      <div>
        <div class="lbl">達成率</div>
        <div class="metric">
          <span class="mono">{{ confirmedPct.toFixed(1) }}</span
          ><span class="unit">%</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.summary {
  display: flex;
  flex-direction: column;
  gap: 22px;
}
.big {
  display: flex;
  align-items: baseline;
  gap: 14px;
  margin-top: 4px;
}
.num {
  font-size: 44px;
  font-weight: 300;
  letter-spacing: -0.02em;
  line-height: 1;
  color: var(--ink);
  @media (min-width: 480px) {
    font-size: 56px;
  }
  @media (min-width: 768px) {
    font-size: 84px;
  }
}
.goal {
  font-size: 16px;
  color: var(--ink-mute);
  @media (min-width: 480px) {
    font-size: 20px;
  }
  @media (min-width: 768px) {
    font-size: 28px;
  }
}
.big {
  flex-wrap: wrap;
  row-gap: 4px;
}
.lbl {
  font-size: 11px;
  color: var(--ink-mute);
  letter-spacing: 0.04em;
}
.projection {
  margin-top: -8px;
  font-size: 12px;
  color: var(--ana-bright);
  letter-spacing: 0.04em;
}
.projection .arrow {
  margin: 0 4px;
  opacity: 0.6;
}
.progress-ghost {
  position: absolute;
  top: 0;
  bottom: 0;
  background: repeating-linear-gradient(
    45deg,
    color-mix(in oklab, var(--ana-sky) 60%, transparent),
    color-mix(in oklab, var(--ana-sky) 60%, transparent) 4px,
    transparent 4px,
    transparent 8px
  );
  transition:
    width 0.6s ease-out,
    left 0.6s ease-out;
}
.bar .legend {
  display: flex;
  gap: 18px;
  margin-top: 10px;
  font-size: 10.5px;
  color: var(--ink-mute);
  letter-spacing: 0.04em;
}
.legend .key {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.legend .sw {
  width: 14px;
  height: 8px;
  border-radius: 1px;
  display: inline-block;
}
.legend .sw-confirmed {
  background: linear-gradient(90deg, var(--ana-blue), var(--ana-bright));
}
.legend .sw-tentative {
  background: repeating-linear-gradient(
    45deg,
    color-mix(in oklab, var(--ana-sky) 60%, transparent),
    color-mix(in oklab, var(--ana-sky) 60%, transparent) 3px,
    transparent 3px,
    transparent 6px
  );
  border: 1px solid color-mix(in oklab, var(--ana-sky) 60%, transparent);
}
.metric .sep {
  margin: 0 6px;
  color: var(--ink-mute);
}
.metric .soft {
  color: var(--ink-mute);
}
.bar .ticks {
  display: flex;
  justify-content: space-between;
  margin-top: 10px;
  font-size: 10px;
  color: var(--ink-mute);
  gap: 6px;
  @media (min-width: 480px) {
    font-size: 11px;
  }
}
.metrics {
  display: flex;
  gap: 28px;
  flex-wrap: wrap;
  margin-top: 6px;
  @media (min-width: 768px) {
    gap: 48px;
  }
}
.metric {
  display: flex;
  align-items: baseline;
  gap: 6px;
  margin-top: 6px;
}
.metric .mono {
  font-size: 22px;
  font-weight: 400;
  letter-spacing: -0.01em;
  @media (min-width: 768px) {
    font-size: 26px;
  }
}
.unit {
  font-size: 11px;
  color: var(--ink-mute);
}
</style>
