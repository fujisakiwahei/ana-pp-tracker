<script setup lang="ts">
definePageMeta({ layout: "auth" });

const supabase = useSupabaseClient();
const user = useSupabaseUser();

const mode = ref<"signin" | "signup">("signin");
const email = ref("");
const password = ref("");
const error = ref("");
const busy = ref(false);

watch(
  user,
  (v) => {
    if (v) navigateTo("/");
  },
  { immediate: true },
);

async function submit() {
  error.value = "";
  busy.value = true;
  try {
    if (mode.value === "signin") {
      const { error: err } = await supabase.auth.signInWithPassword({
        email: email.value,
        password: password.value,
      });
      if (err) throw err;
    } else {
      const { error: err } = await supabase.auth.signUp({
        email: email.value,
        password: password.value,
      });
      if (err) throw err;
    }
  } catch (e) {
    error.value = toErrorMessage(e, "サインインに失敗しました");
  } finally {
    busy.value = false;
  }
}
</script>

<template>
  <div class="login">
    <aside class="editorial">
      <div class="top">
        <h1 class="display italic title">
          PP Ledger
        </h1>
        <p class="lede">
          ANA国内線のプレミアムポイントを記録して、福岡・那覇・羽田を起点に「あと何往復で届くか」を一目で確認できる、個人用の搭乗台帳です。
        </p>
      </div>
      <div class="bottom">
        <span class="goal-jp">プラチナまで 50,000 PP</span>
      </div>
    </aside>
    <section class="form-pane">
      <div class="form-inner">
        <h2 class="display italic heading">
          {{ mode === "signin" ? "おかえりなさい" : "アカウントを作る" }}
        </h2>
        <p class="lede-jp">
          {{ mode === "signin"
            ? "登録済みのメールアドレスとパスワードでサインインしてください。"
            : "メールアドレスとパスワード(6文字以上)を入力してください。" }}
        </p>
        <form class="form" @submit.prevent="submit">
          <div class="field">
            <label class="field-label">メールアドレス<span class="required-mark" aria-hidden="true">*</span></label>
            <input
              v-model="email"
              class="input"
              type="email"
              autocomplete="email"
              placeholder="you@example.com"
              required
            />
          </div>
          <div class="field">
            <label class="field-label">パスワード<span class="required-mark" aria-hidden="true">*</span></label>
            <input
              v-model="password"
              class="input"
              type="password"
              :autocomplete="mode === 'signin' ? 'current-password' : 'new-password'"
              placeholder="••••••••"
              required
              minlength="6"
            />
            <p v-if="mode === 'signup'" class="hint">
              6文字以上で設定してください。
            </p>
          </div>
          <p v-if="error" class="error mono">{{ error }}</p>
          <button class="btn submit" type="submit" :disabled="busy">
            {{ busy ? "送信中…" : mode === "signin" ? "サインイン" : "アカウント作成" }}
          </button>
        </form>
        <div class="toggle">
          <button
            type="button"
            class="btn-link"
            @click="mode = mode === 'signin' ? 'signup' : 'signin'; error = ''"
          >
            {{ mode === "signin"
              ? "はじめての方はこちら(新規登録)"
              : "サインインに戻る" }}
          </button>
        </div>
        <p class="note">
          このアプリは個人専用です。フライト記録はあなた自身しか見られません。
        </p>
      </div>
    </section>
  </div>
</template>

<style lang="scss" scoped>
.login {
  display: grid;
  grid-template-columns: 1fr;
  min-height: 100vh;
  @media (min-width: 900px) {
    grid-template-columns: 1.1fr 1fr;
  }
}
.editorial {
  padding: 40px 32px;
  background: var(--ink);
  color: var(--paper);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 32px;
  @media (min-width: 900px) {
    padding: 56px 64px;
  }
}
.lede-jp {
  font-size: 13px;
  color: var(--ink-mute);
  line-height: 1.7;
  margin: 0 0 24px;
}
.hint {
  font-size: 11px;
  color: var(--ink-mute);
  margin-top: 6px;
}
.goal-jp {
  font-size: 13px;
  letter-spacing: 0.04em;
  color: var(--gold);
}
.title {
  font-size: 48px;
  line-height: 1.02;
  margin: 18px 0 0;
  letter-spacing: 0.005em;
  @media (min-width: 900px) {
    font-size: 68px;
  }
}
.lede {
  max-width: 380px;
  margin-top: 28px;
  font-size: 13.5px;
  color: color-mix(in srgb, var(--paper) 78%, transparent);
  line-height: 1.7;
}
.bottom {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 16px;
  flex-wrap: wrap;
}
.ver {
  font-size: 10px;
  letter-spacing: 0.2em;
  color: color-mix(in srgb, var(--paper) 50%, transparent);
}
.goal {
  font-size: 16px;
  color: var(--gold);
}
.form-pane {
  padding: 40px 32px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  @media (min-width: 900px) {
    padding: 56px 72px;
  }
}
.form-inner {
  max-width: 360px;
  width: 100%;
}
.heading {
  font-size: 40px;
  margin: 10px 0 28px;
  @media (min-width: 900px) {
    font-size: 46px;
  }
}
.form {
  display: flex;
  flex-direction: column;
  gap: 22px;
}
.submit {
  width: 100%;
  padding: 14px;
}
.error {
  color: var(--alert);
  font-size: 11px;
  letter-spacing: 0.04em;
}
.toggle {
  margin-top: 24px;
}
.note {
  margin-top: 36px;
  font-size: 11px;
  color: var(--ink-mute);
  line-height: 1.6;
}
</style>
