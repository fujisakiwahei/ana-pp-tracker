<template>
  <div class="screen auth-screen">
    <slot />
  </div>
</template>

<style lang="scss" scoped>
.auth-screen {
  min-height: 100vh;
  background: var(--paper);
}
</style>
