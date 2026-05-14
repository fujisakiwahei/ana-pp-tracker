<script setup lang="ts">
export interface PreviewRow {
  index: number;
  flown_at: string;
  flight_number?: string;
  from_airport: string;
  to_airport: string;
  cabin: string;
  pp?: string | number;
  ok: boolean;
  issue?: string;
}
defineProps<{ rows: PreviewRow[] }>();
</script>

<template>
  <table class="tbl">
    <thead>
      <tr>
        <th style="width: 30px">行</th>
        <th>搭乗日</th>
        <th>便名</th>
        <th>出発</th>
        <th>到着</th>
        <th>クラス</th>
        <th>PP</th>
        <th>状態</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="r in rows" :key="r.index" :class="{ error: !r.ok }">
        <td class="mono muted">{{ r.index }}</td>
        <td class="mono">{{ r.flown_at }}</td>
        <td class="mono">{{ r.flight_number || "—" }}</td>
        <td class="mono">{{ r.from_airport }}</td>
        <td class="mono">{{ r.to_airport }}</td>
        <td class="mono">{{ r.cabin }}</td>
        <td class="mono muted">{{ r.pp || "(自動)" }}</td>
        <td>
          <span v-if="r.ok" class="badge ok">● 登録できる</span>
          <span v-else class="badge alert">● {{ r.issue ?? "エラー" }}</span>
        </td>
      </tr>
    </tbody>
  </table>
</template>

<style lang="scss" scoped>
.muted {
  color: var(--ink-mute);
}
.badge {
  font-size: 11px;
  letter-spacing: 0.04em;
}
.badge.ok {
  color: var(--ok);
}
.badge.alert {
  color: var(--alert);
}
</style>
