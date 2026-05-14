<script setup lang="ts">
const route = useRoute();
const user = useSupabaseUser();
const supabase = useSupabaseClient();

const NAV = [
  { id: "dashboard", label: "DASHBOARD", to: "/" },
  { id: "flights", label: "FLIGHTS", to: "/flights" },
  { id: "routes", label: "ROUTES", to: "/routes" },
  { id: "import", label: "IMPORT", to: "/import" },
];

const isActive = (to: string) => {
  if (to === "/") return route.path === "/";
  return route.path.startsWith(to);
};

const initial = computed(() => {
  const email = user.value?.email ?? "";
  return email.charAt(0).toUpperCase() || "·";
});

async function signOut() {
  await supabase.auth.signOut();
  await navigateTo("/login");
}
</script>

<template>
  <header class="app-header">
    <NuxtLink to="/" class="brand">
      <span class="brand-bar" />
      <span class="brand-mark">PP Ledger</span>
      <span class="brand-sub">ANA Domestic · 2026</span>
    </NuxtLink>
    <nav class="nav">
      <NuxtLink
        v-for="n in NAV"
        :key="n.id"
        :to="n.to"
        :class="{ active: isActive(n.to) }"
      >
        {{ n.label }}
      </NuxtLink>
    </nav>
    <div class="user-chip">
      <span>{{ user?.email ?? "" }}</span>
      <span class="dot" :title="`サインアウト (${user?.email ?? ''})`" @click="signOut">
        {{ initial }}
      </span>
    </div>
  </header>
</template>

<style lang="scss" scoped>
.brand {
  cursor: pointer;
}
.nav a {
  cursor: pointer;
}
@media (max-width: 767px) {
  .app-header {
    flex-wrap: wrap;
  }
  .nav {
    order: 3;
    width: 100%;
    overflow-x: auto;
    padding-top: 6px;
  }
}
</style>
