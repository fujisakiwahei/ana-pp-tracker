export default defineNuxtConfig({
  compatibilityDate: "2026-01-01",
  future: { compatibilityVersion: 4 },

  // API は別オリジンの Worker (apps/api) に移したので、サーバ側で描く materialが無い。
  // 認証も Bearer トークンのみ (Cookie を使わない) にしたため、SSR のまま残すと
  // サーバ側にセッションが無い状態で描画することになる。SPA に倒す。
  // 1人用アプリなので SEO も初期表示速度も要件ではない。
  ssr: false,

  runtimeConfig: {
    public: {
      // 本番は NUXT_PUBLIC_API_BASE で上書きする。既定は wrangler dev の待ち受け先。
      apiBase: "http://localhost:8787",
    },
  },

  modules: ["@nuxtjs/supabase", "@vee-validate/nuxt", "@nuxt/eslint"],

  components: [{ path: "~/components", pathPrefix: false }],

  app: {
    head: {
      title: "PP Ledger — ANA Domestic",
      link: [
        { rel: "preconnect", href: "https://fonts.googleapis.com" },
        { rel: "preconnect", href: "https://fonts.gstatic.com", crossorigin: "" },
        {
          rel: "stylesheet",
          href: "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&family=JetBrains+Mono:wght@300;400;500&family=Noto+Sans+JP:wght@300;350;400;500;700&display=swap",
        },
      ],
    },
  },

  supabase: {
    url: process.env.SUPABASE_URL,
    key: process.env.SUPABASE_PUBLISHABLE_KEY,
    // serviceKey は意図的に渡さない。RLS をバイパスする Service Role は
    // どのハンドラでも使っておらず、渡さなければ誤用も起こらない。
    // 将来ユーザーのセッション外で動く管理処理が必要になったら復活させる。
    redirectOptions: {
      login: "/login",
      callback: "/confirm",
      include: ["/", "/flights", "/flights/**", "/import", "/routes"],
      exclude: ["/login", "/confirm"],
    },
  },

  veeValidate: {
    autoImports: true,
  },

  eslint: {
    config: {
      // @nuxt/eslint-config は typescript の有無を isPackageExists("typescript") で
      // 判定する。monorepo にしてルート直下に typescript が居なくなると false に倒れ、
      // 生成される設定から @typescript-eslint プラグインごと消える
      // (ルートの eslint.config.mjs がそのルールを参照しているので即エラーになる)。
      // パッケージ解決の副作用に依存させず明示する。
      typescript: true,
    },
  },

  css: ["~/assets/styles/main.scss"],
});
