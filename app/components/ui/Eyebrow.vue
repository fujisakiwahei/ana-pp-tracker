<script setup lang="ts">
defineProps<{ text?: string }>();
</script>

<template>
  <span class="eyebrow"><slot>{{ text }}</slot></span>
</template>
