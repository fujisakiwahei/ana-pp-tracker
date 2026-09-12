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
packages/core/   ドメインロジック (旧 shared/)。Nuxt にも Hono にも依存しない  ✅
apps/api/        Hono on Cloudflare Workers                                  ✅
apps/web/        Nuxt 4 (SPA)。apps/api のクライアント        ← 現在リポジトリ直下
ios/             Xcode / SwiftUI                              ← 未着手
```

Nuxt はまだリポジトリ直下にある。`apps/web/` への移動は Phase 2 でまとめて行う
(先にやると設定ファイルのパスを2度触ることになるため)。

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

### Phase 1 — Hono を横に立てる ✅ 完了

`pnpm create hono@latest apps/api -t cloudflare-workers -p pnpm` で作った Worker に、
Nuxt の8エンドポイントを移植し `GET /pp/preview` を新設した。
Nuxt は従来どおり動いたまま。切り替えは Phase 2。

| 変更              | 内容                                                                                                                                                                                                                                                 |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET /pp/preview` | 片道PPの内訳を返す。iOS は PP を自分で計算しない (決定#2) ので、記録前のプレビューにサーバ側の口が要る。**認証を掛けていない** — 返すのは公開運賃表の計算結果だけでユーザーデータを含まず、認証を挟むと入力1文字ごとに Supabase への往復が増えるため |
| エラー形状        | `{ error: { message, issues? } }` に固定した。Nuxt 時代は `createError()` の戻りが Nitro の形式でそのまま出ていて、レスポンスの形がフレームワーク任せだった                                                                                          |
| 認証              | `src/middleware/auth.ts`。リクエストごとにユーザーの JWT を載せた Supabase クライアントを作るので **RLS が効いたまま**。各クエリの `.eq("user_id", ...)` も Nuxt 版と同じく残してある                                                                |
| CSV 取り込み      | h3 の `readMultipartFormData()` + Node の `Buffer` を、標準の `FormData` / `File` に置き換えた。Workers 非互換はここ1箇所だけだった (事前の grep どおり)                                                                                             |
| `flightRow.ts`    | `server/utils/` から `packages/core/` へ移した。Nuxt と Hono の両方が使うため。付随するテスト2本も core へ                                                                                                                                           |
| クエリ解釈        | `intQuery()` を追加。Nuxt 版は `?year=abc` が `NaN-01-01` という日付文字列になり、エラーにならず黙って0件を返していた                                                                                                                                |
| テスト            | `app.request()` でハンドラ単位のテスト36本。Nuxt server routes では書けなかった層                                                                                                                                                                    |
| CI                | `wrangler deploy --dry-run` を追加。Node 専用 API を持ち込むとここで落ちる                                                                                                                                                                           |

Worker のバンドルは gzip 258KB (大半は supabase-js)。Workers の上限には余裕がある。

環境変数は `apps/api/.dev.vars.example` を参照。
ローカルは `.dev.vars`、本番は `wrangler secret put` で渡す。
Service Role キーは置かない (RLS をバイパスするため)。

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
