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
        <th style="width: 30px">#</th>
        <th>Date</th>
        <th>Flight</th>
        <th>From</th>
        <th>To</th>
        <th>Cabin</th>
        <th>PP</th>
        <th>Status</th>
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
        <td class="mono muted">{{ r.pp || "(auto)" }}</td>
        <td>
          <span v-if="r.ok" class="badge ok">● OK</span>
          <span v-else class="badge alert">● {{ r.issue ?? "Error" }}</span>
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
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 0.2em;
}
.badge.ok {
  color: var(--ok);
}
.badge.alert {
  color: var(--alert);
  letter-spacing: 0.05em;
}
</style>
