export default defineNuxtConfig({
  compatibilityDate: "2026-01-01",
  future: { compatibilityVersion: 4 },

  modules: ["@nuxtjs/supabase", "@vee-validate/nuxt"],

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
    serviceKey: process.env.SUPABASE_SECRET_KEY,
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

  imports: {
    dirs: ["shared"],
  },

  css: ["~/assets/styles/main.scss"],

});
