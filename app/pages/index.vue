<script setup lang="ts">
import { getCurrentYear, getSuggestions } from "~~/shared/pp";
import type { CabinClass } from "~~/shared/routes";
import type { FlightRow } from "~~/shared/schema";

const user = useSupabaseUser();
const year = ref(getCurrentYear());
const suggestionCabin = ref<CabinClass>("economy");
const { data: stats, refresh } = await usePPStats(year);

const { data: flightList } = await useFetch<{ items: FlightRow[]; total: number; year: number }>(
  "/api/flights",
  {
    query: computed(() => ({ year: year.value, limit: 5 })),
  }
);

const recentFlights = computed(() => flightList.value?.items ?? []);
const suggestions = computed(() => {
  if (!stats.value) return [];
  return getSuggestions(stats.value.remainingPP, suggestionCabin.value);
});

const userName = computed(() => {
  const email = user.value?.email ?? "";
  const local = email.split("@")[0] ?? "";
  return local.charAt(0).toUpperCase() + local.slice(1);
});
</script>

<template>
  <div class="subheader">
    <div>
      <div class="subhead-jp">{{ year }}年度の搭乗台帳</div>
      <h1 class="display italic page-title">おかえりなさい、{{ userName }}さん</h1>
    </div>
    <NuxtLink to="/flights/new" class="btn">+ フライトを記録</NuxtLink>
  </div>
  <div class="page-body" v-if="stats">
    <section class="hero block-section block--hero">
      <PPSummaryCard
        :confirmed-p-p="stats.confirmedPP"
        :tentative-p-p="stats.tentativePP"
        :goal-p-p="stats.goalPP"
        :remaining-p-p="stats.remainingPP"
        :progress="stats.progress"
        :tentative-progress="stats.tentativeProgress"
        :confirmed-count="stats.confirmedCount"
        :tentative-count="stats.tentativeCount"
      />
    </section>

    <section class="block block-section block--plan">
      <header class="block-head">
        <div>
          <div class="subhead-jp">目標まであと {{ stats.remainingPP.toLocaleString() }} PP</div>
          <h2 class="section-title">どの路線なら、あと何往復?</h2>
        </div>
        <div class="head-actions">
          <NuxtLink to="/routes" class="btn-link">路線一覧を見る →</NuxtLink>
        </div>
      </header>
      <hr class="divider-thick" />
      <div class="seg-row">
        <Segmented
          v-model="suggestionCabin"
          :options="[
            { value: 'economy', label: 'エコノミー' },
            { value: 'first', label: 'プレミアム' },
          ]"
        />
      </div>
      <div class="suggestions">
        <PPGoalHint
          v-for="(s, i) in suggestions"
          :key="`${s.from}-${s.to}-${s.cabin}`"
          :suggestion="s"
          :class="{ bordered: i < suggestions.length - 1 }"
        />
      </div>
    </section>

    <section class="block block-section block--log">
      <header class="block-head">
        <div>
          <div class="subhead-jp">直近の記録</div>
          <h2 class="section-title">最近のフライト</h2>
        </div>
        <NuxtLink to="/flights" class="btn-link">すべての記録を見る →</NuxtLink>
      </header>
      <hr class="divider-thick" />
      <FlightTable :flights="recentFlights" compact />
      <p v-if="recentFlights.length === 0" class="empty">
        まだフライトが記録されていません。「+ フライトを記録」から最初の搭乗を登録してください。
      </p>
    </section>
  </div>
</template>

<style lang="scss" scoped>
.subhead-jp {
  font-size: 12px;
  color: var(--ink-mute);
  letter-spacing: 0.04em;
  margin-bottom: 4px;
}
.empty {
  padding: 24px 0 8px;
  font-size: 12.5px;
  color: var(--ink-mute);
  line-height: 1.7;
}
.page-title {
  font-weight: 500;
  font-size: 32px;
  margin: 10px 0 0;
  letter-spacing: 0.005em;
  @media (min-width: 768px) {
    font-size: 46px;
  }
}
.hero {
  display: grid;
  grid-template-columns: 1fr;
  gap: 28px;
  margin-bottom: 44px;
}
.block {
  margin-bottom: 44px;
}
.block-section {
  position: relative;
  border-radius: 4px;
  padding: 28px 16px 24px;
  border: 1px solid var(--line-soft);
  border-left: 3px solid var(--accent);
  margin-inline: -12px;
  @media (min-width: 768px) {
    padding: 32px 36px 32px;
    margin-inline: 0;
  }
}
.block--hero {
  background: linear-gradient(
    180deg,
    var(--card) 0%,
    color-mix(in oklab, var(--card) 92%, var(--ana-mist)) 100%
  );
  border-left-color: var(--ana-blue);
}
.block--plan {
  background: color-mix(in oklab, var(--ana-mist) 35%, var(--card));
  border-left-color: var(--ana-bright);
}
.block--log {
  background: color-mix(in oklab, var(--gold-soft) 30%, var(--card));
  border-left-color: var(--gold);
}
.block-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 16px;
  gap: 12px;
  flex-wrap: wrap;
}
.head-actions {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}
.seg-row {
  display: flex;
  justify-content: flex-start;
  padding: 12px 0 16px;
}
.suggestions {
  display: grid;
  grid-template-columns: 1fr;
  @media (min-width: 600px) {
    grid-template-columns: 1fr 1fr;
  }
  @media (min-width: 1024px) {
    grid-template-columns: repeat(4, 1fr);
  }
}
.suggestions > .bordered {
  border-right: 1px solid var(--line);
}
@media (max-width: 1023px) {
  .suggestions > .bordered {
    border-right: none;
    border-bottom: 1px solid var(--line);
  }
}
</style>
