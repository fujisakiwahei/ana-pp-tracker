// @ts-check
import withNuxt from "./apps/web/.nuxt/eslint.config.mjs";
import prettier from "eslint-config-prettier";

const composed = withNuxt(
  {
    ignores: [
      // デザイン検討用のモックアップ (React/JSX)。アプリのビルド対象外。
      "design-tone/**",
      // main.scss のコンパイル済み出力。
      "main.css",
      "main.css.map",
    ],
  },
  {
    // files を絞るのは、参照するプラグインを持つ設定オブジェクトと
    // 対象ファイルを揃えるため。絞らないと .mjs や .json にもこの
    // オブジェクトが当たり、そこでは @typescript-eslint が未登録になる。
    files: ["**/*.ts", "**/*.tsx", "**/*.vue"],
    rules: {
      // 意図的に未使用の引数は _ 始まりで示す慣習にする。
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },
  {
    files: ["**/*.vue"],
    rules: {
      // Vue 3 はフラグメント(複数ルート)が正当。各ページが
      // <subheader> + <page-body> の2ルート構成なので無効化する。
      "vue/no-multiple-template-root": "off",
    },
  },
  {
    files: ["apps/api/**/*.ts"],
    rules: {
      // Service Role キーは RLS を完全にバイパスする。
      // API は必ずリクエスト元ユーザーの JWT を載せたクライアントで DB を触る。
      //
      // Nuxt 時代は `#supabase/server` の serverSupabaseServiceRole を禁止する
      // ルールがこれを担保していた。server/ を消した時点でその歯止めが無くなり、
      // Bindings に鍵を1つ足すだけで全ハンドラの RLS が黙って外れる状態になる
      // (lint も型も既存テストも通ってしまう)。識別子と文字列の両方を弾く。
      "no-restricted-syntax": [
        "error",
        {
          selector: "Identifier[name=/SERVICE_ROLE|serviceRole/i]",
          message:
            "Service Role キーは RLS をバイパスします。ユーザーの JWT を載せた Supabase クライアント (middleware/auth.ts) を使ってください。",
        },
        {
          selector: "Literal[value=/SERVICE_ROLE|service_role/i]",
          message:
            "Service Role キーは RLS をバイパスします。ユーザーの JWT を載せた Supabase クライアント (middleware/auth.ts) を使ってください。",
        },
      ],
    },
  },
  // 整形は Prettier に任せ、競合するスタイル系ルールを無効化する。
  prettier
);

/**
 * Nuxt が生成する設定のうち、`app/pages/**` のようにプロジェクト相対の
 * files を持つものに basePath を与える。
 *
 * ESLint は files パターンを設定ファイルの位置 (= リポジトリルート) 基準で
 * 解決するため、Nuxt を apps/web へ移した時点でこれらが一切マッチしなくなり、
 * ページやレイアウトに対する vue/multi-word-component-names の緩和が
 * 外れてしまう。プラグインを登録するだけのオブジェクトは全体に効かせたいので、
 * app/ 相対のパターンを持つものだけを対象にする。
 */
const NUXT_APP_DIR = "apps/web";
const isProjectRelative = (config) =>
  config.files?.some((f) => typeof f === "string" && f.startsWith("app/"));

export default (await composed.toConfigs()).map((config) =>
  isProjectRelative(config) ? { ...config, basePath: NUXT_APP_DIR } : config
);
