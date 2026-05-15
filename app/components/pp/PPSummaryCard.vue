<script setup lang="ts">
const props = defineProps<{
  totalPP: number;
  goalPP: number;
  remainingPP: number;
  progress: number;
  flightsCount: number;
}>();

const pct = computed(() => Math.min(100, props.progress * 100));
</script>

<template>
  <div class="summary">
    <div class="lbl">今年の積算PP</div>
    <div class="big">
      <span class="num mono">{{ totalPP.toLocaleString() }}</span>
      <span class="goal display italic">/ {{ goalPP.toLocaleString() }}</span>
    </div>
    <div class="bar">
      <div class="progress">
        <div class="progress-fill" :style="{ width: `${pct}%` }" />
      </div>
      <div class="ticks">
        <span>0 PP</span>
        <span>達成率 {{ pct.toFixed(1) }}% · ブロンズ 30,000</span>
        <span>プラチナ 50,000</span>
      </div>
    </div>
    <div class="metrics">
      <div>
        <div class="lbl">目標まで残り</div>
        <div class="metric"><span class="mono">{{ remainingPP.toLocaleString() }}</span><span class="unit">PP</span></div>
      </div>
      <div>
        <div class="lbl">今年の搭乗</div>
        <div class="metric"><span class="mono">{{ flightsCount }}</span><span class="unit">便</span></div>
      </div>
      <div>
        <div class="lbl">達成率</div>
        <div class="metric"><span class="mono">{{ pct.toFixed(1) }}</span><span class="unit">%</span></div>
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
