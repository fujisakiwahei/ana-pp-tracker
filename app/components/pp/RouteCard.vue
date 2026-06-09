<script setup lang="ts">
import type { CabinClass, Route, AirportCode, FareType } from "~~/shared/routes";
import { AIRPORTS } from "~~/shared/airports";
import { buildAnaReservationUrl, calcPP } from "~~/shared/pp";
import { lookupMarket, yenPerPP } from "~~/shared/marketFares";

const props = withDefaults(
  defineProps<{
    route: Route;
    cabin: CabinClass;
    from: AirportCode;
    to: AirportCode;
    fareType?: FareType;
    flownAt?: string;
  }>(),
  { fareType: "simple" }
);

const ppOneWay = computed(() => {
  const dt = props.flownAt ?? new Date().toISOString().slice(0, 10);
  return calcPP(props.from, props.to, props.cabin, props.fareType, dt) ?? 0;
});
const ppRoundTrip = computed(() => ppOneWay.value * 2);

// 相場の目安は「代表運賃 simple」固定で評価（画面の運賃セレクタとは独立）。
const market = computed(() => lookupMarket(props.from, props.to, props.cabin));
const marketPP = computed(() => {
  const dt = props.flownAt ?? new Date().toISOString().slice(0, 10);
  return calcPP(props.from, props.to, props.cabin, "simple", dt);
});
const marketView = computed(() => {
  const m = market.value;
  const pp = marketPP.value;
  if (!m || !pp) return null;
  const good = yenPerPP(m.goodPrice, pp);
  const ok = yenPerPP(m.okPrice, pp);
  if (good == null || ok == null) return null;
  return {
    good: { yen: m.goodPrice, perPP: good },
    ok: { yen: m.okPrice, perPP: ok },
  };
});

const reservationUrl = computed(() => buildAnaReservationUrl(props.from, props.to));
</script>

<template>
  <article class="card route">
    <header>
      <RouteCodeBadge :from="from" :to="to" big />
      <span class="mult mono">×2</span>
    </header>
    <div class="names">{{ AIRPORTS[from].name }} ⇄ {{ AIRPORTS[to].name }}</div>
    <div class="stats">
      <div class="stat">
        <span class="lbl">基本マイル</span>
        <span class="val mono">{{ route.baseMiles.toLocaleString() }}</span>
      </div>
      <div class="stat accent">
        <span class="lbl">片道PP</span>
        <span class="val mono">{{ ppOneWay.toLocaleString() }}</span>
      </div>
      <div class="stat">
        <span class="lbl">往復PP</span>
        <span class="val mono">{{ ppRoundTrip.toLocaleString() }}</span>
      </div>
    </div>
    <div v-if="marketView" class="market" aria-label="PP単価の目安">
      <div class="market-head">
        <span class="market-lbl">PP単価の目安</span>
        <span class="market-note">シンプル運賃 基準・片道</span>
      </div>
      <div class="bands">
        <div class="band good">
          <span class="dot" aria-hidden="true" />
          <span class="band-lbl">お得</span>
          <span class="band-val mono">〜¥{{ marketView.good.yen.toLocaleString() }}</span>
          <span class="band-perpp mono">{{ marketView.good.perPP.toFixed(1) }}円/PP</span>
        </div>
        <div class="band ok">
          <span class="dot" aria-hidden="true" />
          <span class="band-lbl">許容</span>
          <span class="band-val mono">〜¥{{ marketView.ok.yen.toLocaleString() }}</span>
          <span class="band-perpp mono">{{ marketView.ok.perPP.toFixed(1) }}円/PP</span>
        </div>
        <div class="band high">
          <span class="dot" aria-hidden="true" />
          <span class="band-lbl">高い</span>
          <span class="band-val mono">¥{{ marketView.ok.yen.toLocaleString() }}超</span>
          <span class="band-perpp mono">—</span>
        </div>
      </div>
    </div>
    <footer>
      <CabinPill :cabin="cabin" />
      <a class="btn-link" :href="reservationUrl" target="_blank" rel="noopener"> ANAで予約 → </a>
    </footer>
  </article>
</template>

<style lang="scss" scoped>
.route {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
}
.mult {
  font-size: 10px;
  letter-spacing: 0.15em;
  color: var(--ink-mute);
}
.names {
  color: var(--ink-soft);
  font-size: 12.5px;
}
.stats {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  border-top: 1px solid var(--line);
  border-bottom: 1px solid var(--line);
  padding: 14px 0;
  gap: 0;
}
.stat {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding-right: 8px;
}
.stat .lbl {
  font-size: 10.5px;
  color: var(--ink-mute);
  letter-spacing: 0.04em;
}
.stat .val {
  font-size: 16px;
  font-weight: 400;
  letter-spacing: -0.01em;
  color: var(--ink-soft);
}
.stat.accent .val {
  font-size: 22px;
  font-weight: 500;
  color: var(--ink);
}
.market {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.market-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
}
.market-lbl {
  font-size: 10.5px;
  letter-spacing: 0.04em;
  color: var(--ink-mute);
}
.market-note {
  font-size: 9.5px;
  letter-spacing: 0.02em;
  color: var(--ink-mute);
}
.bands {
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.band {
  display: grid;
  grid-template-columns: auto auto 1fr auto;
  align-items: center;
  gap: 8px;
}
.band .dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
}
.band .band-lbl {
  font-size: 10.5px;
  color: var(--ink-soft);
}
.band .band-val {
  font-size: 11px;
  color: var(--ink-soft);
}
.band .band-perpp {
  font-size: 10px;
  color: var(--ink-mute);
  text-align: right;
}
.band.good .dot {
  background: var(--ok);
}
.band.ok .dot {
  background: var(--gold);
}
.band.high .dot {
  background: var(--alert);
}
.band.good .band-lbl {
  color: var(--ok);
}
.band.ok .band-lbl {
  color: var(--gold);
}
.band.high .band-lbl {
  color: var(--alert);
}
footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 4px;
}
</style>
