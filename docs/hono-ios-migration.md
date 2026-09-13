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
apps/web/        Nuxt 4 (SPA)。apps/api のクライアント                          ✅
ios/             Xcode / SwiftUI                              ← 未着手
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

### Phase 2 — Web を乗せ替える ✅ 完了

Nuxt の server routes を削除し、`apps/api` を叩く SPA にした上で、
Nuxt 本体を `apps/web/` へ移した。

| 変更                                   | 内容                                                                                                                                                     |
| -------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ssr: false`                           | API が別オリジンになり認証も Bearer のみになったので、サーバ側にセッションが無い状態で描く意味がない。ビルド出力は 5.09MB → 1.72MB (gzip 1.19MB → 411kB) |
| `app/composables/useApi.ts`            | ベースURLと Authorization ヘッダを集約。以前は `"/api/..."` が6ファイルに散っていた                                                                      |
| `useFetch` → `useAsyncData` + `$fetch` | Authorization ヘッダをリクエストの都度組み立てるため (トークン更新後も正しい値になる)                                                                    |
| `toErrorMessage`                       | API の新しいエラー形 (`data.error.message`) を読む                                                                                                       |
| ディレクトリ                           | Nuxt を `apps/web/` へ。`package.json` を分割し、ルートは各ワークスペースへ委譲するだけにした                                                            |

**PP 計算は Web からは `@ana/core/pp` を直接呼ぶ。** `/pp/preview` は Swift から
同じ計算を使うための口で、同じ TS を使える Web が往復する理由はない。
どちらも定義元は `packages/core` の1箇所なので二重実装にはならない。

移動でハマった点: `@nuxt/eslint-config` は TS 機能の有無を
`isPackageExists("typescript")` で判定する。`typescript` をルートから `apps/web` へ
移した瞬間に false へ倒れ、生成される設定から `@typescript-eslint` プラグインごと
消えた (ルートの設定がそのルールを参照しているので即エラー)。
`nuxt.config.ts` の `eslint.config.typescript: true` で明示してある。

もう1点、Nuxt が生成する設定には `app/pages/**` のようにプロジェクト相対の
`files` を持つオブジェクトがある。ESLint はこれを設定ファイルの位置
(= リポジトリルート) 基準で解決するため、移動後は一切マッチしなくなり、
ページやレイアウトに対する `vue/multi-word-component-names` の緩和が外れた。
ルートの `eslint.config.mjs` で該当オブジェクトにだけ `basePath` を与えている。

### Phase 3 — iOS

Supabase 認証 (supabase-swift)、`useFlights` を写した `APIClient`、
画面は Dashboard / Flights / Detail / Routes / Login。
オフラインは `GET /flights` と `GET /stats/summary` のレスポンスを Codable で保存し、
「最終同期」を表示するだけ。同期キューも競合解決も作らない。

## 明示的にスコープ外

- **CSV インポートは Web 専用**。iOS に画面を作らない。
- **Nuxt は SPA 化する**。Bearer 認証 + SSR はハマる組み合わせで、1人用アプリに SSR の見返りがない。
- **Supabase Auth は両クライアント共通の IdP**。Hono は検証するだけで発行しない。

## セルフレビューで直したもの

Phase 0〜2 をまとめてレビューして見つかったもの。すべて本 PR 内で修正し、
再発を防ぐテストを足してある。

| 内容                                                           | どう壊れるか                                                                                                                   |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Hono 自身の `HTTPException` を 500 に潰していた                | 壊れた JSON ボディなど、クライアントの入力ミスが全部サーバ障害として返る                                                       |
| `CORS_ORIGIN` 未設定が `origin: []` になっていた               | 200 は返るが `Access-Control-Allow-Origin` が付かず、ブラウザが全レスポンスを捨てる。サーバ側には何のログも残らない            |
| `limit` / `offset` が負値を素通し                              | `.range(-3, -9)` が PostgREST に弾かれ、入力ミスが 500 になる                                                                  |
| `?year=1e21` が `Number.isFinite` を通過                       | `1e+21-01-01` という日付文字列になり、黙って0件が返る (`NaN` を潰したのと同じ穴)                                               |
| PATCH の「対象なし」が 500、GET の障害が 404                   | 存在しない行の編集がサーバエラーに見え、逆に実際の障害が「見つかりません」に隠れる                                             |
| ヘッダ行だけの CSV が成功扱い                                  | 空配列を insert して `{ ok: true, inserted: 0 }` を返す。間違ったファイルを上げたことに気づけない                              |
| `todayISO()` が UTC、`getCurrentYear()` がローカル時刻         | Workers は常に UTC。日本のユーザーには毎朝 9:00 JST まで当日便が搭乗済に入らず、年明けも9時間ずれる                            |
| `apiBase` の既定値が `http://localhost:8787`                   | 環境変数を入れ忘れた本番がブラウザから localhost を叩き、mixed content で黙って全滅する                                        |
| Service Role 禁止の lint ルールが消えていた                    | `server/**` を消したときに一緒に消えた。`Bindings` に鍵を1つ足すだけで全ハンドラの RLS が外れ、lint も型もテストも通ってしまう |
| CSV が `file` という名前のフィールドしか受け付けない           | Nuxt 版にあった「名前が違っても File なら拾う」挙動が落ちていた                                                                |
| `$fetch` が 400 で例外になり、行ごとの検証エラーが画面に出ない | 「行 3: 出発地が不正です」ではなく「400 Bad Request」しか出ない                                                                |
| ダッシュボードで2本のリクエストを直列に await                  | API が別オリジンになった分、初期表示が往復の合計だけ待たされる                                                                 |

## 刺さると分かっているもの

| 箇所           | 内容                                                                                                                                                                                                                                                                                          |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Workers 移植   | Node 固有 API は `server/api/flights/import.post.ts` の `readMultipartFormData` + Buffer の**1箇所だけ** (grep 済み)。`await c.req.formData()` → `File.text()` に置き換える。papaparse は純 JS なのでそのまま動く                                                                             |
| 認証レイテンシ | `getUser()` が毎リクエスト Supabase への往復になる。JWKS でローカル検証 (`jose` は Workers で動く) に切り替えたいが、Supabase の署名方式 (レガシーの HS256 か新しい非対称鍵か) は実プロジェクトを見ないと確定できない。**認証の検証経路を実機確認なしで差し替えるのは危ないので別 PR に回す** |
| PP プレビュー  | フィールド変更ごとに `/pp/preview` を叩くので debounce 必須。iOS は圏外だとプレビューできない — 決定#4 で受け入れた代償                                                                                                                                                                       |
| 無料署名       | ビルドが7日で失効する。「飛行機で使う」と正面衝突する                                                                                                                                                                                                                                         |
| CORS           | 2デプロイ先構成は「ローカルでは動くのに本番で401」の定番発生源                                                                                                                                                                                                                                |
