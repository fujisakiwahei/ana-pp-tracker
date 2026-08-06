# リファクタリング提案 一覧

コードベース全体を読んだうえでまとめたリファクタ提案のインデックス。
詳細（該当ファイル・行番号・受け入れ基準）は各 Issue を参照。

調査時点: 2026-08-06 / 対象コミット: `3fca711`

---

## 優先度の考え方

1. **壊れやすさ** — すでに事故が起きた／起きうる箇所を先に潰す
2. **他の作業の前提になるか** — テスト基盤は他のリファクタの安全網になる
3. **触る範囲の広さ** — 大きい変更ほど、先にテストを整えてから着手する

---

## 提案一覧

| # | Issue | 概要 | 主な対象 |
| --- | --- | --- | --- |
| 1 | [#10](https://github.com/fujisakiwahei/ana-pp-tracker/issues/10) | テスト・型チェック・Lint・CIを整備する | `package.json`, `.github/` |
| 2 | [#5](https://github.com/fujisakiwahei/ana-pp-tracker/issues/5) | 空港・クラス・運賃種別の定義を1箇所に集約する | `shared/routes.ts`, `shared/schema.ts`, `shared/airports.ts` |
| 3 | [#7](https://github.com/fujisakiwahei/ana-pp-tracker/issues/7) | 全APIがService RoleでRLSを迂回している状態を見直す | `server/api/**` |
| 4 | [#6](https://github.com/fujisakiwahei/ana-pp-tracker/issues/6) | サーバAPIの行マッピングとPP解決処理を共通化する | `server/api/flights/**` |
| 5 | [#9](https://github.com/fujisakiwahei/ana-pp-tracker/issues/9) | PP計算の内訳を `shared/pp.ts` から返し、UI側の逆算ハックを廃止する | `shared/pp.ts`, `FlightForm.vue` |
| 6 | [#8](https://github.com/fujisakiwahei/ana-pp-tracker/issues/8) | `FlightForm.vue`(811行)を分割し、復路をvee-validate管理下に統一する | `app/components/flight/**` |
| 7 | [#11](https://github.com/fujisakiwahei/ana-pp-tracker/issues/11) | 未使用の `database.types.ts` を整理し、Supabaseクライアントを型付けする | `app/types/database.types.ts` |
| 8 | [#12](https://github.com/fujisakiwahei/ana-pp-tracker/issues/12) | ページ共通のヘッダーとSCSSの重複を共通化する | `app/pages/**` |
| 9 | [#13](https://github.com/fujisakiwahei/ana-pp-tracker/issues/13) | リポジトリ直下のビルド成果物・作業用ファイルを整理する | `main.css`, `design-tone/` |

---

## 推奨する着手順

```
#10 テスト基盤
      ↓  （安全網を先に作る）
#5 定義の一元化  ──┐
#13 ファイル整理  ─┤  独立して進められる
                   ↓
#9 PP内訳の公開  →  #8 FlightForm分割
                   ↓
#7 RLS  →  #6 API共通化  →  #11 型付け
                   ↓
#12 SCSS共通化   （いつでも可）
```

- **#10 を最初に**。`calcPP()` は端数切り捨て・新旧運賃の切替・`first: null` など静かに間違いうる仕様を抱えており、#5 / #6 / #9 はいずれもその周辺を触る。
- **#5 と #13 は独立**。他に依存しないので、隙間時間で先に片付けられる。
- **#9 → #8 の順**。`FlightForm.vue` の逆算ハック（18行）は #9 で不要になるため、分割前に消しておくと差分が小さい。
- **#7 → #6 の順**。Supabaseクライアントの生成方法を変える #7 を先にすると、#6 で共通化する対象が確定する。

---

## 根拠となった主な観測

| 観測 | 該当Issue |
| --- | --- |
| `f3b3d57 fix: 空港バリデーションのZod enumに WKJ/KUH/SHB を追加` — 空港追加時に3ファイル中1つを更新し忘れて発生したfix | #5 |
| `NRT` が `AIRPORTS`・Zod enum にあるが `ROUTES` に0件 → 選べるのに保存で400 | #5 |
| 16フィールドの行マッピングが3ハンドラにコピペ。PP自動計算失敗のメッセージもすでに文言が揺れている | #6 |
| 全7ハンドラが `serverSupabaseServiceRole` を使用。RLSポリシー4本が一度も効いていない | #7 |
| `FlightForm.vue` 811行（2位の `RouteCard.vue` 252行の3倍超）。復路だけ素の `ref` 8個 + 手書き検証 | #8 |
| `fareBreakdown` が `autoPP` から積算率を総当たり逆算。マジックナンバー `[0,100,200,400]` / 誤差 `0.6` / `30..150` | #9 |
| `test` / `lint` / `typecheck` スクリプトなし、`.github/` なし | #10 |
| `app/types/database.types.ts` (62行) がどこからも import されていない。クライアントに `Database` 型が渡っていないため結果が実質 `any` | #11 |
| `.subhead-jp` が6ページに同一定義。`scoped` のため1箇所直しても他に効かず、`.page-title` はすでに `index.vue` だけズレている | #12 |
| `main.css` / `main.css.map` が Git 管理下だが参照ゼロ（`nuxt.config.ts` は `main.scss` を指す） | #13 |
