import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Hono は標準の Request/Response で動くので、ハンドラのテストに
    // workerd を立ち上げる必要はない。app.request() を node 上で直接叩く。
    environment: "node",
    include: ["test/**/*.spec.ts"],
  },
});
