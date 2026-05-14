<template>
  <div class="screen">
    <HeaderNav />
    <slot />
    <footer class="footer">
      <span class="mono">
        ※ PP値はシンプル運賃を前提とした代表値です。実際の積算と100%一致しない可能性があります。
      </span>
    </footer>
  </div>
</template>

<style lang="scss" scoped>
.footer {
  padding: 24px 28px 32px;
  border-top: 1px solid var(--line);
  font-size: 10.5px;
  color: var(--ink-mute);
  letter-spacing: 0.04em;
  @media (min-width: 768px) {
    padding: 24px 48px 32px;
  }
}
</style>
