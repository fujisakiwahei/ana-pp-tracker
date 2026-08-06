// @ts-check
import withNuxt from "./.nuxt/eslint.config.mjs";
import prettier from "eslint-config-prettier";

export default withNuxt(
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
    rules: {
      // 意図的に未使用の引数は _ 始まりで示す慣習にする。
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      // Vue 3 はフラグメント(複数ルート)が正当。各ページが
      // <subheader> + <page-body> の2ルート構成なので無効化する。
      "vue/no-multiple-template-root": "off",
    },
  },
  // 整形は Prettier に任せ、競合するスタイル系ルールを無効化する。
  prettier
);
