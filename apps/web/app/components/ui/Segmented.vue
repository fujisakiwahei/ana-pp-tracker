<script setup lang="ts" generic="T extends string">
const props = defineProps<{
  modelValue: T;
  options: Array<{ value: T; label: string }>;
}>();
const emit = defineEmits<{ "update:modelValue": [v: T] }>();
</script>

<template>
  <div class="seg">
    <button
      v-for="opt in props.options"
      :key="opt.value"
      type="button"
      :class="{ active: opt.value === props.modelValue }"
      @click="emit('update:modelValue', opt.value)"
    >
      {{ opt.label }}
    </button>
  </div>
</template>
