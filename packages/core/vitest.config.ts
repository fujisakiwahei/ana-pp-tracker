import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Nuxt のエイリアスもランタイムも使わない素の TS なので node 環境で直接動く。
    environment: "node",
    include: ["test/**/*.spec.ts"],
  },
});
