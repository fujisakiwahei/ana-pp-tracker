import { defineConfig } from "vitest/config";

export default defineConfig({
  // 各ワークスペースが自分の vitest.config.ts を持つ。
  // ルートから pnpm test を叩くと全部まとめて走る。
  test: { projects: ["packages/*", "apps/*"] },
});
