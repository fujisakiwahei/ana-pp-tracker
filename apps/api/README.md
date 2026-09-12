# @ana/api

ANA PP Tracker の API。Hono on Cloudflare Workers。

移行の全体像は [docs/hono-ios-migration.md](../../docs/hono-ios-migration.md) を参照。
現時点では Nuxt の server routes も並行して動いており、切り替えは Phase 2。

## 起動

```bash
cp .dev.vars.example .dev.vars   # 値は Supabase のプロジェクト設定から
pnpm -F @ana/api dev
```

`SUPABASE_SERVICE_ROLE_KEY` は**置かない**。RLS を完全にバイパスするため、
どのハンドラでも使わないし、渡さなければ誤用も起こらない。

## エンドポイント

| メソッド | パス                  | 認証     | 備考                                              |
| -------- | --------------------- | -------- | ------------------------------------------------- |
| GET      | `/flights`            | 要       | クエリ: `year` `limit`(最大1000) `offset`         |
| POST     | `/flights`            | 要       | `round_trip` なら復路も同時に登録                 |
| GET      | `/flights/:id`        | 要       |                                                   |
| PATCH    | `/flights/:id`        | 要       | PP を計算し直す                                   |
| DELETE   | `/flights/:id`        | 要       |                                                   |
| POST     | `/flights/import`     | 要       | multipart の CSV。行エラーがあれば1行も登録しない |
| GET      | `/flights/sample-csv` | 不要     | BOM 付き (Excel 対策)                             |
| GET      | `/stats/summary`      | 要       | クエリ: `year`                                    |
| GET      | `/pp/preview`         | **不要** | 片道PPの内訳。下記参照                            |

### 認証

`Authorization: Bearer <Supabase の access token>`。
リクエストごとにそのトークンを載せた Supabase クライアントを作るので、
`flights` テーブルの RLS ポリシーがそのまま効く。

### `/pp/preview` に認証が無い理由

返すのは ANA が公開している運賃表の計算結果だけで、ユーザーのデータを含まない。
iOS アプリは PP を自分で計算しない方針なので、フォームの入力中プレビューが
この口を叩くことになる。認証を挟むと1文字ごとに Supabase への往復が増える。

### エラー

```json
{ "error": { "message": "Validation failed", "issues": [] } }
```

`issues` は Zod の検証失敗時のみ。CSV 取り込みの行エラーだけは例外で、
`{ "ok": false, "errors": [{ "row": 3, "issues": [...] }] }` を 400 で返す。

## テスト

```bash
pnpm -F @ana/api test
```

`app.request()` を node 上で直接叩く。Supabase クライアントは
`test/supabaseStub.ts` で差し替えるので、実際の DB は要らない。
