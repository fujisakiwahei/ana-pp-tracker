# リファクタリング提案 一覧

コードベース全体を読んだうえでまとめたリファクタ提案のインデックス。
詳細（該当ファイル・行番号・受け入れ基準）は各 Issue を参照。

調査時点: 2026-08-06 / 対象コミット: `3fca711`

**すべて実装してPRを出し済み。CIは全PRグリーン。**

---

## 優先度の考え方

1. **壊れやすさ** — すでに事故が起きた／起きうる箇所を先に潰す
2. **他の作業の前提になるか** — テスト基盤は他のリファクタの安全網になる
3. **触る範囲の広さ** — 大きい変更ほど、先にテストを整えてから着手する

---

## 提案一覧

| # | Issue | PR | 概要 | 主な対象 |
| --- | --- | --- | --- | --- |
| 1 | [#10](https://github.com/fujisakiwahei/ana-pp-tracker/issues/10) | [#14](https://github.com/fujisakiwahei/ana-pp-tracker/pull/14) | テスト・型チェック・Lint・CIを整備する | `package.json`, `.github/` |
| 2 | [#5](https://github.com/fujisakiwahei/ana-pp-tracker/issues/5) | [#16](https://github.com/fujisakiwahei/ana-pp-tracker/pull/16) | 空港・クラス・運賃種別の定義を1箇所に集約する | `shared/routes.ts`, `shared/schema.ts`, `shared/airports.ts` |
| 3 | [#7](https://github.com/fujisakiwahei/ana-pp-tracker/issues/7) | [#20](https://github.com/fujisakiwahei/ana-pp-tracker/pull/20) | 全APIがService RoleでRLSを迂回している状態を見直す | `server/api/**` |
| 4 | [#6](https://github.com/fujisakiwahei/ana-pp-tracker/issues/6) | [#21](https://github.com/fujisakiwahei/ana-pp-tracker/pull/21) | サーバAPIの行マッピングとPP解決処理を共通化する | `server/api/flights/**` |
| 5 | [#9](https://github.com/fujisakiwahei/ana-pp-tracker/issues/9) | [#17](https://github.com/fujisakiwahei/ana-pp-tracker/pull/17) | PP計算の内訳を `shared/pp.ts` から返し、UI側の逆算ハックを廃止する | `shared/pp.ts`, `FlightForm.vue` |
| 6 | [#8](https://github.com/fujisakiwahei/ana-pp-tracker/issues/8) | [#18](https://github.com/fujisakiwahei/ana-pp-tracker/pull/18) | `FlightForm.vue`(811行)を分割し、復路をvee-validate管理下に統一する | `app/components/flight/**` |
| 7 | [#11](https://github.com/fujisakiwahei/ana-pp-tracker/issues/11) | [#22](https://github.com/fujisakiwahei/ana-pp-tracker/pull/22) | 未使用の `database.types.ts` を整理し、Supabaseクライアントを型付けする | `app/types/database.types.ts` |
| 8 | [#12](https://github.com/fujisakiwahei/ana-pp-tracker/issues/12) | [#19](https://github.com/fujisakiwahei/ana-pp-tracker/pull/19) | ページ共通のヘッダーとSCSSの重複を共通化する | `app/pages/**` |
| 9 | [#13](https://github.com/fujisakiwahei/ana-pp-tracker/issues/13) | [#15](https://github.com/fujisakiwahei/ana-pp-tracker/pull/15) | リポジトリ直下のビルド成果物・作業用ファイルを整理する | `main.css`, `design-tone/` |

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


---

## PR のスタック構成

同じファイルを触るものは積み重ねてある。base ブランチを親PRに向けているので、
親をマージすると子の差分はそのPRの内容だけになる。

```
main ─┬─ #14 テスト/CI ─┬─ #16 定義集約 ─ #17 PP内訳 ─ #18 Form分割 ─ #19 SCSS
      │                 └─ #20 RLS ─ #21 API共通化 ─ #22 型付け
      └─ #15 ファイル整理
```

マージ順は上の図の左から右へ。`#14` と `#15` は独立しているのでどちらからでもよい。

## 実装して分かったこと（Issue 起票時点では気づいていなかった点）

| PR | 内容 |
| --- | --- |
| [#17](https://github.com/fujisakiwahei/ana-pp-tracker/pull/17) | 逆算ハックは「壊れやすい」ではなく **すでに壊れていた**。全328通り中177通り（54%）で積算率・搭乗ポイントを誤表示していた。合計PPは正しいので記録値に影響はない |
| [#14](https://github.com/fujisakiwahei/ana-pp-tracker/pull/14) | ESLint導入で、正規表現リテラルの中に BOM(U+FEFF) が不可視のまま埋め込まれていたのを検出 |
| [#19](https://github.com/fujisakiwahei/ana-pp-tracker/pull/19) | ダッシュボードの見出しだけ `.display .italic`（斜体）で、他ページの `.section-title` と別物だった。前後のスクリーンショット比較で検出 |
| [#22](https://github.com/fujisakiwahei/ana-pp-tracker/pull/22) | DB行の型を `interface` で書くと supabase-js の制約を満たせず、スキーマ全体が `never` に落ちて型付けが黙って無効になる |

## 残した判断（レビューで決めてほしいもの）

- **NRT**（[#16](https://github.com/fujisakiwahei/ana-pp-tracker/pull/16)）— 基本マイルを推測で埋めたくないので路線は追加せず、フォームの選択肢を `ROUTES` から導出する形にした。成田を使いたくなったら `ROUTES` に追加すれば自動で選択肢に戻る
- **`design-tone/` の去就**（[#15](https://github.com/fujisakiwahei/ana-pp-tracker/pull/15)）— 削除ではなく `docs/` へ移動した。不要なら削除に切り替え可
- **DBのCHECK制約**（[#22](https://github.com/fujisakiwahei/ana-pp-tracker/pull/22)）— 空港コード・運賃種別にCHECK制約を足せば型が完全に truthful になるが、既存データの検証が要るので別PR扱いにした
- **RLSの実動作確認**（[#20](https://github.com/fujisakiwahei/ana-pp-tracker/pull/20)）— 実際のSupabaseプロジェクトが要るためこちらでは未確認。マージ前に実データでの確認をお願いしたい
