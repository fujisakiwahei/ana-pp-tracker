<script setup lang="ts">
defineProps<{
  total: number;
  valid: number;
  errors: number;
  willAdd: number;
}>();
</script>

<template>
  <div class="strip">
    <div class="cell">
      <div class="lbl">読み込んだ行数</div>
      <div class="val mono">{{ total }}</div>
    </div>
    <div class="cell">
      <div class="lbl">登録できる</div>
      <div class="val mono ok">{{ valid }}</div>
    </div>
    <div class="cell">
      <div class="lbl">エラー</div>
      <div class="val mono alert">{{ errors }}</div>
    </div>
    <div class="cell last">
      <div class="lbl">追加されるPP</div>
      <div class="val mono">+{{ willAdd.toLocaleString() }}</div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.strip {
  display: flex;
  border: 1px solid var(--line);
  background: var(--card);
}
.cell {
  flex: 1;
  padding: 18px 22px;
  border-right: 1px solid var(--line);
}
.lbl {
  font-size: 11px;
  color: var(--ink-mute);
  letter-spacing: 0.04em;
}
.cell.last {
  border-right: none;
}
.val {
  font-size: 26px;
  font-weight: 400;
  margin-top: 4px;
  color: var(--ink);
}
.val.ok {
  color: var(--ok);
}
.val.alert {
  color: var(--alert);
}
</style>
