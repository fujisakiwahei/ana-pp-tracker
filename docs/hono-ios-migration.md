# Hono バックエンド + iOS アプリ への移行計画

Nuxt のサーバルートを Hono (Cloudflare Workers) に移し、SwiftUI の iOS アプリを追加する。
Web も残す。策定日: 2026-09-12 / 対象コミット: `ed00195`

---

## 決めたこと

| #   | 決定                                                         | 却下した案と理由                                                                                                                                                                    |
| --- | ------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | iOS は **SwiftUI ネイティブ**                                | Expo (TS のまま core を再利用できる) / Capacitor (Nuxt を WebView で包む)。ネイティブを選んだ以上、PP ロジックの二重実装をどう避けるかが#2                                          |
| 2   | **PP 計算はサーバだけが行う**。Swift 側は表示のみ            | Swift へ移植 + 両言語で同じ golden fixture を検証する案もあった。#4 でオフライン書き込みを捨てたので、書き込み時は必ず通信がある → サーバ計算で成立する。二重実装が構造的に起きない |
| 3   | **Web は残す**。Nuxt は Hono API のクライアントになる        | iOS 専用にすれば認証もデプロイも半分になるが、CSV インポートとPCでの入力を失う                                                                                                      |
| 4   | オフラインは **読み取りのみ**                                | 機内で新規登録できる完全オフラインは、ローカルストア・同期キュー・競合解決が必要。最終同期分の閲覧だけなら JSON キャッシュ1枚で済む                                                 |
| 5   | ランタイムは **Cloudflare Workers**、**Supabase は維持**     | D1 へ移ると認証を作り直し、RLS ポリシー4本を手書きの `user_id` フィルタに戻すことになる (PR #20 で消したはずの負債)                                                                 |
| 6   | 認証は **Bearer トークンのみ**、両クライアント共通           | Web だけ Cookie にすると API に認証経路が2本でき、CORS/SameSite の設定ミスが入り込む                                                                                                |
| 7   | **monorepo**                                                 | リポジトリを分けると `packages/core` をレジストリに公開してバージョンを上げる運用が要る。1人には過剰                                                                                |
| 8   | 配布は当面 **無料署名**、実用に足りたら $99 の有料アカウント | 無料署名はビルドが7日で失効する。旅行の前週に必ず踏むので、そこが課金の実質的な期限                                                                                                 |

## 目標構成

```
packages/core/   ドメインロジック (旧 shared/)。Nuxt にも Hono にも依存しない
apps/api/        Hono on Cloudflare Workers
apps/web/        Nuxt 4 (SPA)。apps/api のクライアント
ios/             Xcode / SwiftUI
```

## フェーズ

### Phase 0 — core 抽出 ✅ 完了

`shared/` を `packages/core/` へ移し、`@ana/core/*` のサブパスで import する形にした。
挙動の変更なし。lint / typecheck / test (84件) / build すべてグリーン。

- Nuxt の auto-import に依存していた箇所は**ゼロ**だった (全40箇所が明示 import)。
  `nuxt.config.ts` の `imports.dirs: ["shared"]` は死に設定だったので削除。
- `test/tsconfig.json` は `.nuxt/tsconfig.shared.json` を継承していた =
  ドメインロジックの型チェックに Nuxt のビルド成果物が必要だった。この依存を切った。
- テストは分割: ドメインは `packages/core/test/`、Nuxt 側 (`server/utils`, `app/utils`) は `test/`。
  ルートの `vitest.config.ts` が projects で両方を回す。

### Phase 1 — Hono を横に立てる

```bash
pnpm create hono@latest apps/api   # template: cloudflare-workers
```

- 既存8エンドポイントを移植し、**`GET /pp/preview` を新設**する。
  iOS が計算しない (決定#2) ので、フォームの PP プレビューにサーバ側の口が要る。
- `@hono/zod-validator` に `@ana/core/schema` のスキーマをそのまま渡す。
- 認証ミドルウェア (`server/utils/auth.ts` の置き換え):

  ```ts
  const supabase = createClient<Database>(c.env.SUPABASE_URL, c.env.SUPABASE_PUBLISHABLE_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false },
  });
  ```

  リクエストごとにユーザーの JWT を載せたクライアントを作る → **RLS が効いたまま**。
  PR #20 で確立した性質を壊さない。

- **エラー形状を固定する**。今は `createError` 任せで Nuxt の形に依存している。
  クライアントが2つになる以上、`{ error: { message, issues? } }` と決め打ちにする。
- `app.request()` でハンドラ単位のテストを足す。Nuxt server routes より書きやすく、ここは純粋な利得。

Nuxt は従来どおり動いたまま。切り替えはまだしない。

### Phase 2 — Web を乗せ替える

`ssr: false` にし、`server/` を削除、`#supabase/server` の使用をやめる。
`app/composables/useFlights.ts` が API 呼び出しを1箇所に集約しているので、
**変更はこのファイルと CORS 設定でほぼ終わる**。

Swift を1行も書く前に、実クライアントで API 契約を検証できる。この順序は守る。

### Phase 3 — iOS

Supabase 認証 (supabase-swift)、`useFlights` を写した `APIClient`、
画面は Dashboard / Flights / Detail / Routes / Login。
オフラインは `GET /flights` と `GET /stats/summary` のレスポンスを Codable で保存し、
「最終同期」を表示するだけ。同期キューも競合解決も作らない。

## 明示的にスコープ外

- **CSV インポートは Web 専用**。iOS に画面を作らない。
- **Nuxt は SPA 化する**。Bearer 認証 + SSR はハマる組み合わせで、1人用アプリに SSR の見返りがない。
- **Supabase Auth は両クライアント共通の IdP**。Hono は検証するだけで発行しない。

## 刺さると分かっているもの

| 箇所           | 内容                                                                                                                                                                                                              |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Workers 移植   | Node 固有 API は `server/api/flights/import.post.ts` の `readMultipartFormData` + Buffer の**1箇所だけ** (grep 済み)。`await c.req.formData()` → `File.text()` に置き換える。papaparse は純 JS なのでそのまま動く |
| 認証レイテンシ | `getUser()` が毎リクエスト Supabase への往復になる。JWKS でローカル検証 (`jose` は Workers で動く) へ早めに切り替える                                                                                             |
| PP プレビュー  | フィールド変更ごとに `/pp/preview` を叩くので debounce 必須。iOS は圏外だとプレビューできない — 決定#4 で受け入れた代償                                                                                           |
| 無料署名       | ビルドが7日で失効する。「飛行機で使う」と正面衝突する                                                                                                                                                             |
| CORS           | 2デプロイ先構成は「ローカルでは動くのに本番で401」の定番発生源                                                                                                                                                    |
