import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // shared/ は Nuxt のエイリアスを使わない素の TS なので、
    // Nuxt ランタイムを立ち上げずに node 環境で直接テストできる。
    environment: "node",
    include: ["test/**/*.spec.ts"],
  },
});
