<script setup lang="ts">
withDefaults(
  defineProps<{
    /** タイトル上の小見出し */
    eyebrow: string;
    title: string;
    /**
     * ダッシュボードの挨拶だけ、他ページより一回り大きい斜体の見出しを使う。
     * (.section-title ではなく .display .italic 系の組み合わせ)
     */
    hero?: boolean;
  }>(),
  { hero: false }
);
</script>

<template>
  <div class="subheader">
    <div>
      <div class="subhead-jp">{{ eyebrow }}</div>
      <h1 v-if="hero" class="display italic page-title hero">{{ title }}</h1>
      <h1 v-else class="section-title page-title">{{ title }}</h1>
    </div>
    <!-- 右側のアクションは .subheader の直接の flex 子にしたいので包まない -->
    <slot name="actions" />
  </div>
</template>

<style lang="scss" scoped>
.page-title {
  font-size: 32px;
  @media (min-width: 768px) {
    font-size: 40px;
  }
}
.page-title.hero {
  font-weight: 500;
  margin: 10px 0 0;
  letter-spacing: 0.005em;
  @media (min-width: 768px) {
    font-size: 46px;
  }
}
</style>
