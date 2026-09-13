import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // ここに残るのは Nuxt ランタイムに触らないテストだけ (app/utils)。
    // ドメインロジックのテストは packages/core にある。
    environment: "node",
    include: ["test/**/*.spec.ts"],
  },
});
