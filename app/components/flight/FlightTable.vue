<script setup lang="ts">
import type { FlightRow } from "~~/shared/schema";
import { AIRPORTS } from "~~/shared/airports";

defineProps<{ flights: FlightRow[]; compact?: boolean }>();
</script>

<template>
  <div class="tbl-wrap">
    <table class="tbl">
      <thead>
        <tr>
          <th style="width: 88px">クラス</th>
          <th style="width: 92px">状態</th>
          <th style="width: 110px">搭乗日</th>
          <th style="width: 180px">区間</th>
          <th style="width: 90px">PP</th>
          <th style="width: 90px">便名</th>
          <th v-if="!compact" style="width: 240px">その他</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="f in flights" :key="f.id" class="row" @click="navigateTo(`/flights/${f.id}`)">
          <td><CabinPill :cabin="f.cabin" /></td>
          <td><StatusPill :status="f.status" :flown-at="f.flown_at" /></td>
          <td class="mono">{{ f.flown_at }}</td>
          <td>
            <RouteCodeBadge :from="f.from_airport" :to="f.to_airport" />
            <div class="sub">
              {{ AIRPORTS[f.from_airport].name }} → {{ AIRPORTS[f.to_airport].name }}
            </div>
          </td>
          <td class="num pp">{{ f.pp.toLocaleString() }}</td>
          <td class="mono">{{ f.flight_number ?? "—" }}</td>
          <td v-if="!compact" class="misc">
            <div class="ratings">
              <span><span class="lbl">座席</span><RatingStars :value="f.rating_seat" /></span>
              <span><span class="lbl">機材</span><RatingStars :value="f.rating_aircraft" /></span>
            </div>
            <div class="meta-line mono small">{{ f.aircraft ?? "—" }} ・ {{ f.seat ?? "—" }}</div>
            <div v-if="f.notes" class="notes">{{ f.notes }}</div>
          </td>
        </tr>
        <tr v-if="flights.length === 0" class="empty-row">
          <td :colspan="compact ? 6 : 7">
            <div class="empty">フライトが記録されていません</div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style lang="scss" scoped>
.tbl-wrap {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  margin-inline: -20px;
  padding-inline: 20px;
  @media (min-width: 768px) {
    margin-inline: 0;
    padding-inline: 0;
  }
}
.tbl {
  width: auto;
}
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
.misc {
  font-size: 12px;
  color: var(--ink-soft);
  max-width: 320px;
}
.meta-line {
  margin-top: 4px;
  color: var(--ink-mute);
}
.notes {
  margin-top: 4px;
  color: var(--ink-soft);
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
