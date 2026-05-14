<script setup lang="ts">
import { getCurrentYear } from "~~/shared/pp";

const user = useSupabaseUser();
const year = ref(getCurrentYear());
const { data: stats, refresh } = await usePPStats(year);

const { list } = useFlights();
const { data: flightList } = await useAsyncData(
  "recent-flights",
  () => list({ year: year.value, limit: 5 }),
  { watch: [year] },
);

const recentFlights = computed(() => flightList.value?.items ?? []);
const suggestions = computed(() => stats.value?.suggestions.slice(0, 4) ?? []);

const userName = computed(() => {
  const email = user.value?.email ?? "";
  const local = email.split("@")[0] ?? "";
  return local.charAt(0).toUpperCase() + local.slice(1);
});
</script>

<template>
  <div class="subheader">
    <div>
      <div class="eyebrow">Premium point ledger · Fiscal {{ year }}</div>
      <h1 class="display italic page-title">おかえりなさい、{{ userName }}さん</h1>
    </div>
    <NuxtLink to="/flights/new" class="btn">+ フライトを記録</NuxtLink>
  </div>
  <div class="page-body" v-if="stats">
    <section class="hero">
      <PPSummaryCard
        :total-p-p="stats.totalPP"
        :goal-p-p="stats.goalPP"
        :remaining-p-p="stats.remainingPP"
        :progress="stats.progress"
        :flights-count="stats.flightsCount"
      />
      <StatusTargetCard :year="year" />
    </section>

    <section class="block">
      <header class="block-head">
        <div>
          <div class="eyebrow">目標まであと {{ stats.remainingPP.toLocaleString() }} PP</div>
          <h2 class="section-title">どの路線なら、あと何往復?</h2>
        </div>
        <NuxtLink to="/routes" class="btn-link">VIEW ALL ROUTES →</NuxtLink>
      </header>
      <hr class="divider-thick" />
      <div class="suggestions">
        <PPGoalHint
          v-for="(s, i) in suggestions"
          :key="`${s.from}-${s.to}-${s.cabin}`"
          :suggestion="s"
          :class="{ bordered: i < suggestions.length - 1 }"
        />
      </div>
    </section>

    <section class="block">
      <header class="block-head">
        <div>
          <div class="eyebrow">Recent activity</div>
          <h2 class="section-title">直近のフライト</h2>
        </div>
        <NuxtLink to="/flights" class="btn-link">FULL LOG →</NuxtLink>
      </header>
      <hr class="divider-thick" />
      <FlightTable :flights="recentFlights" compact />
    </section>
  </div>
</template>

<style lang="scss" scoped>
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
  @media (min-width: 900px) {
    grid-template-columns: 1.4fr 1fr;
    gap: 36px;
  }
}
.block {
  margin-bottom: 44px;
}
.block-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 16px;
  gap: 12px;
  flex-wrap: wrap;
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
