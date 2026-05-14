<script setup lang="ts">
const props = defineProps<{
  value?: number | null;
  interactive?: boolean;
}>();
const emit = defineEmits<{ "update:value": [v: number | null] }>();

function setValue(i: number) {
  if (!props.interactive) return;
  if (props.value === i) {
    emit("update:value", null);
  } else {
    emit("update:value", i);
  }
}
</script>

<template>
  <span v-if="!value && !interactive" class="empty">—</span>
  <span v-else class="stars" :class="{ interactive }">
    <span
      v-for="i in 5"
      :key="i"
      :class="{ off: !value || i > value }"
      @click="setValue(i)"
    >
      ★
    </span>
  </span>
</template>

<style lang="scss" scoped>
.empty {
  color: var(--ink-mute);
  font-size: 11px;
}
.stars.interactive {
  font-size: 22px;
  gap: 6px;
  span {
    cursor: pointer;
    user-select: none;
  }
}
</style>
