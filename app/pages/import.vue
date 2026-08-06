<script setup lang="ts">
import type { PreviewRow } from "~/components/import/CsvPreviewTable.vue";
import { csvFlightInputSchema } from "~~/shared/schema";
import { resolvePP } from "~~/shared/pp";

const { parseFile } = useCsv();
const { importCsv } = useFlights();

const file = ref<File | null>(null);
const previewRows = ref<PreviewRow[]>([]);
const totalRows = ref(0);
const validCount = ref(0);
const errorCount = ref(0);
const willAddPP = ref(0);
const busy = ref(false);
const serverError = ref("");

async function onSelect(f: File) {
  file.value = f;
  serverError.value = "";
  const { data } = await parseFile(f);
  totalRows.value = data.length;
  let valid = 0;
  let errs = 0;
  let willAdd = 0;
  const rows: PreviewRow[] = data.map((raw, i) => {
    // サーバ (import.post.ts) と同じスキーマ・同じPP解決を使う。
    const result = csvFlightInputSchema.safeParse(raw);
    if (!result.success) {
      errs += 1;
      const issue = result.error.issues[0];
      return {
        index: i + 1,
        flown_at: raw.flown_at ?? "",
        flight_number: raw.flight_number,
        from_airport: raw.from_airport ?? "",
        to_airport: raw.to_airport ?? "",
        cabin: raw.cabin ?? "",
        pp: raw.pp,
        ok: false,
        issue: issue ? `${(issue.path as string[]).join(".")}: ${issue.message}` : "Invalid",
      };
    }
    const input = result.data;
    const pp = resolvePP(input);
    if (pp == null) {
      errs += 1;
      return {
        index: i + 1,
        flown_at: input.flown_at,
        flight_number: input.flight_number,
        from_airport: input.from_airport,
        to_airport: input.to_airport,
        cabin: input.cabin,
        pp: input.pp,
        ok: false,
        issue: "PP: 路線テーブルから自動計算できませんでした",
      };
    }
    valid += 1;
    willAdd += pp;
    return {
      index: i + 1,
      flown_at: input.flown_at,
      flight_number: input.flight_number,
      from_airport: input.from_airport,
      to_airport: input.to_airport,
      cabin: input.cabin,
      pp: input.pp ?? pp,
      ok: true,
    };
  });
  previewRows.value = rows;
  validCount.value = valid;
  errorCount.value = errs;
  willAddPP.value = willAdd;
}

const canImport = computed(() => !!file.value && errorCount.value === 0 && validCount.value > 0);

async function doImport() {
  if (!file.value || !canImport.value) return;
  busy.value = true;
  serverError.value = "";
  try {
    const res = await importCsv(file.value);
    if ("ok" in res && res.ok) {
      await navigateTo("/flights");
      return;
    }
    serverError.value =
      "サーバ側で検証エラーがありました: " +
      res.errors.map((e) => `行 ${e.row}: ${e.issues[0]?.message}`).join(" / ");
  } catch (e) {
    serverError.value = toErrorMessage(e, "インポートに失敗しました");
  } finally {
    busy.value = false;
  }
}
</script>

<template>
  <PageHeader eyebrow="一括登録" title="CSVから取り込む">
    <template #actions>
      <a href="/api/flights/sample-csv" class="btn btn-ghost" download>
        ↓ サンプルCSVをダウンロード
      </a>
    </template>
  </PageHeader>

  <div class="page-body">
    <p class="lede">
      CSVをアップロードすると内容をプレビューします。出発地・到着地・搭乗日・クラスは必須です。PPを空欄にすると、路線とクラスから自動計算します。
    </p>
    <CsvDropzone :file="file" @select="onSelect" />

    <div v-if="previewRows.length > 0" class="result">
      <CsvStatusStrip
        :total="totalRows"
        :valid="validCount"
        :errors="errorCount"
        :will-add="willAddPP"
      />

      <div class="preview">
        <header>
          <span class="preview-title">プレビュー · {{ totalRows }}件</span>
          <span v-if="errorCount > 0" class="alert">
            {{ errorCount }}件のエラーを修正してください
          </span>
        </header>
        <hr class="divider-thick" />
        <CsvPreviewTable :rows="previewRows" />
      </div>

      <div class="actions">
        <p class="caption">
          1件でもエラーがあるとインポートは行われません。修正してからもう一度アップロードしてください。
        </p>
        <div class="buttons">
          <NuxtLink to="/flights" class="btn btn-ghost">キャンセル</NuxtLink>
          <button class="btn" :disabled="!canImport || busy" @click="doImport">
            {{ busy ? "インポート中…" : `${validCount}件をインポート` }}
          </button>
        </div>
      </div>

      <p v-if="serverError" class="server-error mono">{{ serverError }}</p>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.preview-title {
  font-size: 12px;
  color: var(--ink-mute);
  letter-spacing: 0.04em;
}
.result {
  margin-top: 24px;
  display: flex;
  flex-direction: column;
  gap: 28px;
}
.preview header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 12px;
  gap: 12px;
  flex-wrap: wrap;
}
.alert {
  color: var(--alert);
  font-size: 11px;
  letter-spacing: 0.05em;
}
.actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 18px;
  border-top: 1px solid var(--line);
  gap: 16px;
  flex-wrap: wrap;
}
.caption {
  font-size: 11.5px;
  color: var(--ink-mute);
  max-width: 520px;
  line-height: 1.55;
}
.buttons {
  display: flex;
  gap: 12px;
}
.server-error {
  color: var(--alert);
  font-size: 11px;
}
</style>
