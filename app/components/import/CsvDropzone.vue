<script setup lang="ts">
const props = defineProps<{
  file?: File | null;
}>();
const emit = defineEmits<{ select: [f: File] }>();

const fileInput = ref<HTMLInputElement | null>(null);
const isDragging = ref(false);

function pick() {
  fileInput.value?.click();
}
function onFileChange(e: Event) {
  const f = (e.target as HTMLInputElement).files?.[0];
  if (f) emit("select", f);
}
function onDrop(e: DragEvent) {
  e.preventDefault();
  isDragging.value = false;
  const f = e.dataTransfer?.files?.[0];
  if (f) emit("select", f);
}
function onDragOver(e: DragEvent) {
  e.preventDefault();
  isDragging.value = true;
}
function onDragLeave() {
  isDragging.value = false;
}

const sizeKB = computed(() =>
  props.file ? (props.file.size / 1024).toFixed(1) : "—",
);
</script>

<template>
  <div
    class="dropzone"
    :class="{ active: isDragging }"
    @dragover="onDragOver"
    @dragleave="onDragLeave"
    @drop="onDrop"
    @click="pick"
  >
    <div v-if="!file" class="empty">
      <div class="eyebrow">Drop file · or click to select</div>
      <div class="title display italic">CSVファイルをドロップ</div>
      <div class="hint mono">UTF-8 / ヘッダ付き / 最大1MB目安</div>
    </div>
    <div v-else class="loaded">
      <div>
        <div class="eyebrow">Loaded</div>
        <div class="title display italic">{{ file.name }}</div>
        <div class="hint mono">
          {{ sizeKB }} KB · {{ file.type || "text/csv" }}
        </div>
      </div>
      <button type="button" class="btn btn-ghost" @click.stop="pick">
        別のファイル
      </button>
    </div>
    <input
      ref="fileInput"
      type="file"
      accept=".csv,text/csv"
      hidden
      @change="onFileChange"
    />
  </div>
</template>

<style lang="scss" scoped>
.dropzone {
  border: 1.5px dashed var(--ink);
  padding: 36px 32px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--paper-soft);
  cursor: pointer;
  transition: background 0.18s ease;
  @media (min-width: 768px) {
    padding: 48px;
  }
}
.dropzone.active {
  background: var(--ana-mist);
  border-color: var(--ana-blue);
}
.title {
  font-size: 24px;
  margin-top: 8px;
  @media (min-width: 768px) {
    font-size: 30px;
  }
}
.hint {
  font-size: 11px;
  color: var(--ink-mute);
  margin-top: 6px;
  letter-spacing: 0.05em;
}
.loaded {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  width: 100%;
}
</style>
