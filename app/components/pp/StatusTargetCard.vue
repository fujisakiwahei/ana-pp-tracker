<script setup lang="ts">
defineProps<{ year: number }>();
</script>

<template>
  <aside class="status">
    <div class="card">
      <div class="lbl-accent">目標ステータス</div>
      <div class="title display italic">
        プラチナ<br /><span class="sub">{{ year }}年12月31日まで</span>
      </div>
      <hr class="divider sky" />
      <table>
        <tbody>
          <tr>
            <td class="lbl">ブロンズ</td>
            <td class="val">30,000 PP</td>
          </tr>
          <tr class="primary">
            <td class="lbl">プラチナ</td>
            <td class="val">50,000 PP</td>
          </tr>
          <tr class="muted">
            <td class="lbl">ダイヤモンド</td>
            <td class="val">100,000 PP</td>
          </tr>
        </tbody>
      </table>
      <div class="badge">搭乗中</div>
    </div>
  </aside>
</template>

<style lang="scss" scoped>
.status {
  position: relative;
}
.card {
  padding: 24px 26px;
  background: var(--ana-mist);
  border-color: var(--ana-sky);
  position: relative;
  overflow: hidden;
}
.lbl-accent {
  font-size: 11px;
  color: var(--ana-blue);
  letter-spacing: 0.04em;
  font-weight: 500;
}
.title {
  font-size: 36px;
  font-weight: 500;
  line-height: 1.05;
  margin-top: 8px;
  color: var(--ana-blue);
  @media (min-width: 768px) {
    font-size: 42px;
  }
}
.title .sub {
  color: var(--ink-soft);
}
.divider.sky {
  margin: 20px 0;
  border-top-color: var(--ana-sky);
}
table {
  width: 100%;
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 0.04em;
  border-collapse: collapse;
}
td {
  padding: 4px 0;
}
.lbl {
  color: var(--ink-soft);
}
.val {
  text-align: right;
}
.primary .lbl,
.primary .val {
  color: var(--ana-blue);
  font-weight: 700;
}
.muted .lbl,
.muted .val {
  color: var(--ink-mute);
}
.badge {
  position: absolute;
  top: 20px;
  right: -8px;
  transform: rotate(8deg);
  font-size: 10px;
  letter-spacing: 0.1em;
  color: var(--paper);
  background: var(--ana-blue);
  padding: 3px 12px;
}
</style>
