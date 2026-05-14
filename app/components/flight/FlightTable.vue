<script setup lang="ts">
import type { FlightRow } from "~~/shared/schema";
import { AIRPORTS } from "~~/shared/airports";

defineProps<{ flights: FlightRow[]; compact?: boolean }>();
</script>

<template>
  <table class="tbl">
    <thead>
      <tr>
        <th style="width: 110px">搭乗日</th>
        <th style="width: 80px">便名</th>
        <th>区間</th>
        <th style="width: 88px">クラス</th>
        <th v-if="!compact" style="width: 110px">機材</th>
        <th v-if="!compact" style="width: 70px">座席</th>
        <th v-if="!compact">メモ</th>
        <th style="width: 140px">評価</th>
        <th class="num" style="width: 90px">PP</th>
      </tr>
    </thead>
    <tbody>
      <tr
        v-for="f in flights"
        :key="f.id"
        class="row"
        @click="navigateTo(`/flights/${f.id}`)"
      >
        <td class="mono">{{ f.flown_at }}</td>
        <td class="mono">{{ f.flight_number ?? "—" }}</td>
        <td>
          <RouteCodeBadge :from="f.from_airport" :to="f.to_airport" />
          <div class="sub">
            {{ AIRPORTS[f.from_airport].name }} → {{ AIRPORTS[f.to_airport].name }}
          </div>
        </td>
        <td><CabinPill :cabin="f.cabin" /></td>
        <td v-if="!compact" class="mono small">{{ f.aircraft ?? "—" }}</td>
        <td v-if="!compact" class="mono small">{{ f.seat ?? "—" }}</td>
        <td v-if="!compact" class="notes">{{ f.notes ?? "—" }}</td>
        <td>
          <div class="ratings">
            <span><span class="lbl">座席</span><RatingStars :value="f.rating_seat" /></span>
            <span><span class="lbl">機材</span><RatingStars :value="f.rating_aircraft" /></span>
          </div>
        </td>
        <td class="num pp">{{ f.pp.toLocaleString() }}</td>
      </tr>
      <tr v-if="flights.length === 0" class="empty-row">
        <td :colspan="compact ? 6 : 9">
          <div class="empty">フライトが記録されていません</div>
        </td>
      </tr>
    </tbody>
  </table>
</template>

<style lang="scss" scoped>
.row {
  cursor: pointer;
}
.tbl tbody td.mono {
  white-space: nowrap;
}
.sub {
  color: var(--ink-mute);
  font-size: 11px;
  margin-top: 2px;
}
.small {
  font-size: 12px;
}
.notes {
  font-size: 12px;
  color: var(--ink-soft);
  max-width: 260px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.ratings {
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: 10px;
}
.ratings .lbl {
  color: var(--ink-mute);
  letter-spacing: 0.04em;
  margin-right: 6px;
}
.pp {
  font-size: 15px;
}
.empty {
  padding: 24px;
  text-align: center;
  color: var(--ink-mute);
  font-size: 12px;
  letter-spacing: 0.04em;
}
</style>
