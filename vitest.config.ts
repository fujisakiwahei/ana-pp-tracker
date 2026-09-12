import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // ドメインロジックは packages/core が自分のテストを持つ。
    // ここに残るのは Nuxt 側 (server/utils, app/utils) のテストだけ。
    projects: [
      {
        test: {
          name: "web",
          environment: "node",
          include: ["test/**/*.spec.ts"],
        },
      },
      "packages/*",
    ],
  },
});
