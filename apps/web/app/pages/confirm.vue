<script setup lang="ts">
definePageMeta({ layout: "auth" });

const user = useSupabaseUser();

watch(
  user,
  (v) => {
    if (v) navigateTo("/");
  },
  { immediate: true },
);

onMounted(() => {
  setTimeout(() => {
    if (!user.value) navigateTo("/login");
  }, 2000);
});
</script>

<template>
  <div class="confirm">
    <p class="msg">サインインを処理しています…</p>
    <p class="sub">しばらく経っても画面が切り替わらない場合はサインインし直してください。</p>
  </div>
</template>

<style lang="scss" scoped>
.confirm {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  background: var(--paper);
}
.msg {
  font-family: var(--font-display);
  font-style: italic;
  font-size: 22px;
  color: var(--ink-soft);
}
.sub {
  font-size: 12px;
  color: var(--ink-mute);
}
</style>
