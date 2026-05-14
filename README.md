# ANA PP Tracker — 設計書 & 手順書

ANA国内線のプレミアムポイント(PP)を記録し、福岡・那覇・羽田を起点とした効率的な路線を分析・提案する個人用Webアプリ。

このREADME 1枚で、機内オフラインでも実装が完走できることを目指す。

---

## 目次

- [0. 機内に乗る前のセットアップ手順](#0-機内に乗る前のセットアップ手順)
- [1. プロダクト概要](#1-プロダクト概要)
- [2. プレミアムポイント計算仕様](#2-プレミアムポイント計算仕様)
- [3. 路線テーブル(福岡・那覇・羽田起点)](#3-路線テーブル福岡那覇羽田起点)
- [4. 技術スタック](#4-技術スタック)
- [5. アーキテクチャ・ディレクトリ構成](#5-アーキテクチャディレクトリ構成)
- [6. データベース設計(Supabase)](#6-データベース設計supabase)
- [7. API仕様(Nuxt Server Routes)](#7-api仕様nuxt-server-routes)
- [8. 画面仕様](#8-画面仕様)
- [9. CSVインポート仕様](#9-csvインポート仕様)
- [10. デザイントーン](#10-デザイントーン)
- [11. 実装順序(オフラインでも詰まらない順番)](#11-実装順序オフラインでも詰まらない順番)
- [12. トラブルシューティング](#12-トラブルシューティング)

---

## 0. 機内に乗る前のセットアップ手順

**機内Wi-Fiがなくても動くように、すべての依存と参照ドキュメントをローカルに揃えておく**。以下を **離陸前に必ず** 済ませる。

### 0-1. ランタイム前提

- Node.js **20.x LTS 以上**(Nuxt4の要件)
- pnpm or npm(以下 pnpm 前提で書く。npm/yarn でも可)
- Git

```bash
node -v   # v20.x.x 以上
pnpm -v   # 9.x 以上推奨
```

### 0-2. プロジェクト初期化(機内に乗る前にやる)

```bash
# Nuxt 4 プロジェクトを作る
pnpm dlx nuxi@latest init ana-pp-tracker
cd ana-pp-tracker

# 主要依存を一気にインストール
pnpm add @nuxtjs/supabase @supabase/supabase-js \
         @vee-validate/nuxt @vee-validate/zod vee-validate \
         zod papaparse

# 開発用
pnpm add -D sass @types/papaparse

# pnpm の場合、Supabaseモジュールの依存解決でひっかかることがあるので念のため
pnpm install
```

### 0-3. キャッシュを温めておく

オフラインで `pnpm install` をやり直すケースに備えて、**離陸前に1回ビルドを通しておく**。これで `.nuxt/` の型定義や Nitro のビルド成果物がキャッシュされ、機内でも `pnpm dev` が即起動する。

```bash
pnpm dev
# 起動を確認したら Ctrl+C で止める
```

### 0-4. オフラインで開けるよう保存しておく公式ドキュメント

機内でも参照したくなる確率が高いページ。**ブラウザの「ページを保存」(または Reader Mode → PDF)** でローカルに保存しておく。

- Nuxt 4: https://nuxt.com/docs/4.x/getting-started/introduction
- Nuxt 4 server/api: https://nuxt.com/docs/guide/directory-structure/server
- @nuxtjs/supabase: https://supabase.nuxtjs.org/
- VeeValidate: https://vee-validate.logaretm.com/v4/
- VeeValidate × Zod: https://vee-validate.logaretm.com/v4/integrations/zod-schema-validation/
- Supabase JS: https://supabase.com/docs/reference/javascript
- Supabase Auth(Email + Password): https://supabase.com/docs/guides/auth/passwords
- Supabase RLS: https://supabase.com/docs/guides/database/postgres/row-level-security
- Zod: https://zod.dev/
- PapaParse: https://www.papaparse.com/docs

加えて、本READMEに **PP計算ロジックと路線マイル表をすべて転記** してある(セクション 2, 3)。これだけで機内では十分なはず。

### 0-5. Supabaseプロジェクトを離陸前に作っておく

機内ではSupabaseダッシュボードを開けない前提で、**離陸前に**以下を済ませる。

1. https://supabase.com/dashboard で新規プロジェクト作成(リージョン: Tokyo)
2. **Project Settings → API** から以下を控える
   - `Project URL`
   - `anon public key`
3. **Authentication → Providers** で
   - Email を有効化(**パスワード方式のみ**。マジックリンクは使わない)
   - **Google OAuth は最速実装のためMVPでは見送り**(GCP側の設定が面倒なので、後回し。必要になったら復活させる)
4. **Authentication → URL Configuration** で
   - Site URL: `http://localhost:3000`
   - Redirect URLs に `http://localhost:3000/confirm` を追加(メール確認リンクが踏まれた時の戻り先)
5. **SQL Editor** で本READMEの [6. データベース設計](#6-データベース設計supabase) のマイグレーションSQLを実行
6. `.env.local` にキーを書く

```bash
# ana-pp-tracker/.env.local
SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
SUPABASE_KEY=eyJhbGci...
```

### 0-6. このREADMEとshared定数ファイルを先に作っておく

機内では「決め」のドキュメントが手元にあると詰まらない。

```bash
mkdir -p docs
cp <このREADME> docs/README.md   # またはこのファイル自体をリポジトリに置く
```

### 0-7. 動作確認チェックリスト(離陸前)

- [ ] `node -v` が 20.x 以上
- [ ] `pnpm install` がオフラインでも通る(`pnpm install --offline` で確認)
- [ ] `pnpm dev` が起動する
- [ ] `.env.local` に SUPABASE_URL / SUPABASE_KEY を記入済み
- [ ] Supabase に flights テーブル作成済み・RLSポリシー適用済み
- [ ] Email/Password プロバイダ有効化済み(MVPはこれだけでOK。Google OAuthはスコープ外)
- [ ] このREADMEがリポジトリにコミット済み

---

## 1. プロダクト概要

### 目的

ANA国内線の搭乗を記録し、当年のPP累計を追跡。福岡・那覇・羽田を拠点に「あと何往復でステイタスに届くか」を一目で把握する、個人用Webアプリ。

### 想定ユーザ

- 開発者本人(個人用)
- 日常的にANA国内線を利用し、ステイタス修行を意識するユーザ

### コア要件

| # | 要件 | 備考 |
|---|---|---|
| F-01 | 現在のPP累計を表示 | 当年(1/1〜12/31)集計 |
| F-02 | 50,000 PP(プラチナ条件)までの残量を可視化 | プログレスバー + 残PP |
| F-03 | 「どの路線ならあと何往復」のサジェスト | 拠点(FUK/OKA/HND)別 |
| F-04 | 路線一覧(福岡・那覇・羽田起点)とPP表 | エコノミー / ファーストの切替 |
| F-05 | フライト登録(フォーム) | API経由 |
| F-06 | CSVバルクインポート | サンプルCSVのDL機能つき |
| F-07 | 機体・座席・ラウンジのレビュー(★1〜5 + 自由記述) | 振り返って楽しむ用 |
| F-08 | ANA予約サイトへの導線 | 路線カードから新規予約画面へ |
| F-09 | Email + パスワード認証 | Supabase Auth(MVPはこれのみ。Google OAuthは後回し) |
| F-10 | レスポンシブ(PC / SP) | モバイルファースト寄り |

### ステイタス目標(PPベース)

| ステイタス | 年間PP | うちANAグループ運航便分 |
|---|---|---|
| ブロンズ | 30,000 | 15,000 |
| プラチナ | **50,000** | 25,000 |
| ダイヤモンド | 100,000 | 50,000 |

本アプリのデフォルト目標は **プラチナ(50,000 PP)**。MVPでは50,000固定。

### 集計対象期間

毎年 1/1〜12/31。翌年への持ち越し不可(公式仕様)。アプリ側は「年セレクタ」で過去年も閲覧可能。

### スコープ外(MVP外)

- 国際線対応
- ライフソリューションサービス経由のステイタス
- スターアライアンス便の積算
- マイル管理(PPとは別概念)
- 家族間共有 / 複数ユーザ
- Google / SNS等のソーシャルログイン(将来対応。MVPはEmail + パスワードのみ)

---

## 2. プレミアムポイント計算仕様

> 出典: ANA公式 https://www.ana.co.jp/ja/jp/amc/premium/overview/premium-point/
> 国内線運賃別積算率 https://www.ana.co.jp/ja/jp/amc/flightmile/dom/

### 計算式(国内線・新運賃体系)

```
PP = 区間基本マイレージ
     × 予約クラス・運賃種別の積算率
     × 路線倍率(国内線=2)
     + 搭乗ポイント
```

国内線プレミアムクラス(=新表記ファーストクラス)利用時の +50% 加算分もPP積算の対象。

### 予約クラス・運賃種別ごとの積算率(国内線・新体系)

座席クラス表記は2024年4月以降「ファーストクラス(旧プレミアムクラス) / エコノミークラス(旧普通席)」。

| 座席クラス | 対象運賃 | 積算率 |
|---|---|---|
| ファーストクラス | フレックス / Biz / ANAカード優待割引 / フレックス(国際線接続専用) | **150%** |
| ファーストクラス | スタンダード / 株主優待割引 | **130%** |
| ファーストクラス | シンプル | **120%** |
| ファーストクラス | セール | **100%** |
| エコノミークラス | フレックス / Biz / ANAカード優待割引 / 島民割引 / フレックス(国際線接続専用) | **100%** |
| エコノミークラス | 株主優待割引 / スタンダード | **80%** |
| エコノミークラス | シンプル | **70%** |
| エコノミークラス | セール / 個人包括旅行運賃(APIT) / ユース / シニア / 包括団体旅行運賃(IITA) | **50%** |
| エコノミークラス | 包括旅行割引運賃(ITE) | **30%** |

#### プレミアムクラス(=ファーストクラス)アップグレード時

購入運賃の積算率に **+50%** 加算。
例: スタンダード(エコノミー) 80% → アップグレード → 80% + 50% = **130%**

### 路線倍率

| 路線 | 倍率 |
|---|---|
| 国内線 | **×2** |
| 国際線(日本発着 アジア/オセアニア/ウラジオストク) | ×1.5 |
| 国際線(その他・スターアライアンス便) | ×1 |

本アプリは国内線のみ → **常に ×2** 固定。

### 搭乗ポイント(国内線・新体系)

| 座席クラス | 対象運賃 | 搭乗ポイント(片道) |
|---|---|---|
| ファーストクラス | フレックス / Biz / ANAカード優待割引 / 株主優待割引 / スタンダード / シンプル | **400 pt** |
| エコノミークラス | フレックス / Biz / ANAカード優待割引 / 株主優待割引 | **400 pt** |
| エコノミークラス | スタンダード | **200 pt** |
| エコノミークラス | シンプル | **100 pt** |
| ファーストクラス | セール / フレックス(国際線接続専用) | **0 pt** |
| エコノミークラス | 島民割引 / セール / ユース / シニア / 各種包括旅行運賃 | **0 pt** |

アップグレード時の搭乗ポイントは「元の購入運賃」基準。元運賃が0ptなら0pt。

### アプリ内での運賃種別の扱い(MVP)

要件「主要路線をハードコードしたテーブル方式でOK」に従い、各路線は **「エコノミー / ファースト」の2つの代表値だけ** を持つ。代表値は以下の典型シナリオで算出する。

| 表示上のクラス | 想定する裏側の運賃 | 積算率 | 搭乗ポイント |
|---|---|---|---|
| **エコノミー(代表)** | スタンダード | 80% | 200 pt |
| **ファースト(代表/デフォルト)** | **シンプル** | **120%** | **400 pt** |

> **ファーストは「シンプル」を既定**にする。スタンダードは取得難易度が高い一方、シンプルは予約サイトで素直に取れる実用ライン。プレミアム修行の実勢値に近い。エコノミーは依然「スタンダード」を中庸の代表値として採用。

#### MVPでの片道PP計算式

ANA公式の丸めは `round(基本マイレージ × 積算率 × 路線倍率) + 搭乗ポイント`(国内線倍率=2)。

```
PP(エコノミー)  = round(区間基本マイレージ × 0.80 × 2) + 200
PP(ファースト) = round(区間基本マイレージ × 1.20 × 2) + 400
```

#### 計算例: 羽田⇄福岡(基本マイル 567)

- エコノミー(片道): round(567 × 0.80 × 2) + 200 = **1,107 PP**
- ファースト(片道): round(567 × 1.20 × 2) + 400 = **1,761 PP**
- エコノミー(往復): 2,214 PP → 50,000到達まで **約 23 往復**
- ファースト(往復): 3,522 PP → 50,000到達まで **約 15 往復**

### フライト登録時の挙動

- フォーム送信時、サーバ側で **路線テーブルから自動計算** した値をデフォルトでPPに入れる
- ユーザがPP欄を手動入力した場合は **そちらを尊重**(実際の積算実績と合わせたい時用)
- 「公式数値と100%一致しない可能性」をフッターに小さく注記する

### 積算対象外(注意点)

- 特典航空券 / 無償航空券 / チャーター便 / 包括団体旅行運賃(条件あり)
- 会員本人名義以外の搭乗

---

## 3. 路線テーブル(福岡・那覇・羽田起点)

出典: 国内線マイレージチャート https://www.ana.co.jp/ja/jp/amc/flightmile/dom/chart/

「区間基本マイル」はANA公式数値そのまま。「エコノミーPP(片道)」「ファーストPP(片道)」は前節 2 の MVP代表値計算式で算出した値。

### 3-1. 空港マスタ

| コード | 空港名 | 都市 |
|---|---|---|
| HND | 羽田 | 東京 |
| NRT | 成田 | 東京 |
| FUK | 福岡 | 福岡 |
| OKA | 那覇 | 沖縄 |
| CTS | 新千歳 | 札幌 |
| ITM | 伊丹 | 大阪 |
| KIX | 関西 | 大阪 |
| NGO | 中部 | 名古屋 |
| SDJ | 仙台 | 仙台 |
| HIJ | 広島 | 広島 |
| KMJ | 熊本 | 熊本 |
| KOJ | 鹿児島 | 鹿児島 |
| NGS | 長崎 | 長崎 |
| MYJ | 松山 | 松山 |
| OKJ | 岡山 | 岡山 |
| HKD | 函館 | 函館 |
| ISG | 石垣 | 石垣 |
| MMY | 宮古 | 宮古 |
| KMI | 宮崎 | 宮崎 |
| OIT | 大分 | 大分 |

### 3-2. 羽田(HND)発着 主要路線

ファーストPPは「シンプル運賃」基準(積算率120%・搭乗ポイント400)。

| 行先 | 基本マイル | エコノミーPP(片道) | ファーストPP(片道) |
|---|---:|---:|---:|
| 新千歳(CTS) | 510 | 1,016 | 1,624 |
| 仙台(SDJ) | 177 | 483 | 825 |
| 函館(HKD) | 424 | 878 | 1,418 |
| 中部(NGO) | 193 | 509 | 863 |
| 伊丹(ITM)/関西(KIX) | 280 | 648 | 1,072 |
| 岡山(OKJ) | 356 | 770 | 1,254 |
| 広島(HIJ) | 414 | 862 | 1,394 |
| 松山(MYJ) | 438 | 901 | 1,451 |
| 福岡(FUK) | 567 | 1,107 | 1,761 |
| 熊本(KMJ) | 568 | 1,109 | 1,763 |
| 長崎(NGS) | 610 | 1,176 | 1,864 |
| 大分(OIT) | 499 | 998 | 1,598 |
| 宮崎(KMI) | 561 | 1,098 | 1,746 |
| 鹿児島(KOJ) | 601 | 1,162 | 1,842 |
| 沖縄(OKA) | 984 | 1,774 | 2,762 |
| 石垣(ISG) | 1,224 | 2,158 | 3,338 |
| 宮古(MMY) | 1,158 | 2,053 | 3,179 |

### 3-3. 福岡(FUK)発着 主要路線

ファーストPPは「シンプル運賃」基準(積算率120%・搭乗ポイント400)。

| 行先 | 基本マイル | エコノミーPP(片道) | ファーストPP(片道) |
|---|---:|---:|---:|
| 羽田(HND) | 567 | 1,107 | 1,761 |
| 中部(NGO) | 374 | 798 | 1,298 |
| 伊丹/関西(ITM/KIX) | 287 | 659 | 1,089 |
| 新千歳(CTS) | 882 | 1,611 | 2,517 |
| 仙台(SDJ) | 665 | 1,264 | 1,996 |
| 那覇(OKA) | 537 | 1,059 | 1,689 |
| 宮古(MMY) | 683 | 1,293 | 2,039 |
| 石垣(ISG) | 737 | 1,379 | 2,169 |
| 宮崎(KMI) | 131 | 410 | 714 |

> 福岡→大阪/中部/沖縄あたりが「中距離・短時間で乗りやすい」ゾーン。修行のメインルートになりやすい。

### 3-4. 那覇(OKA)発着 主要路線

ファーストPPは「シンプル運賃」基準(積算率120%・搭乗ポイント400)。

| 行先 | 基本マイル | エコノミーPP(片道) | ファーストPP(片道) |
|---|---:|---:|---:|
| 羽田(HND) | 984 | 1,774 | 2,762 |
| 中部(NGO) | 809 | 1,494 | 2,342 |
| 伊丹/関西(ITM/KIX) | 739 | 1,382 | 2,174 |
| 新千歳(CTS) | 1,397 | 2,435 | 3,753 |
| 仙台(SDJ) | 1,130 | 2,008 | 3,112 |
| 福岡(FUK) | 537 | 1,059 | 1,689 |
| 広島(HIJ) | 650 | 1,240 | 1,960 |
| 松山(MYJ) | 607 | 1,171 | 1,857 |
| 熊本(KMJ) | 494 | 990 | 1,586 |
| 鹿児島(KOJ) | 429 | 886 | 1,430 |
| 宮古(MMY) | 177 | 483 | 825 |
| 石垣(ISG) | 247 | 595 | 993 |

> **OKA-CTS は片道2,435 PPの最強路線**。エコノミー往復で4,870 PP、約10往復で50,000到達。修行界隈で有名な「沖止め最大効率ルート」。

### 3-5. ハードコード用JSONフォーマット

`shared/routes.ts` で以下の形で持つ想定。

```ts
export type CabinClass = 'economy' | 'first'
export type AirportCode =
  | 'HND' | 'NRT' | 'FUK' | 'OKA' | 'CTS' | 'ITM' | 'KIX' | 'NGO'
  | 'SDJ' | 'HIJ' | 'KMJ' | 'KOJ' | 'NGS' | 'MYJ' | 'OKJ' | 'HKD'
  | 'ISG' | 'MMY' | 'KMI' | 'OIT'

export interface Route {
  from: AirportCode
  to: AirportCode
  baseMiles: number
  ppEconomy: number   // 片道PP(エコノミー代表値: スタンダード相当)
  ppFirst: number     // 片道PP(ファースト代表値: スタンダード相当)
}

export const ROUTES: Route[] = [
  { from: 'HND', to: 'FUK', baseMiles: 567, ppEconomy: 1107, ppFirst: 1761 },
  { from: 'HND', to: 'OKA', baseMiles: 984, ppEconomy: 1774, ppFirst: 2762 },
  // ... 上記表の値をそのまま列挙
]
```

`ppFirst` は「ファースト×シンプル運賃」を既定値として算出している(積算率120%・搭乗ポイント400)。上位運賃(スタンダード/フレックス等)の積算をしたい場合は、フライト登録フォームで PP を手動入力して上書きする運用。

`findRoute(from, to)` は双方向で同じ路線として扱う(HND→FUK と FUK→HND は同じ値)。

### 3-6. 予約サイトへのリンク

ANA国内線 空席案内のクエリ形式:

```
https://aswbe-i.ana.co.jp/internet/dms/ic21/ICW010Action.do?depAirportCd={FROM}&arrAirportCd={TO}
```

各路線カードの「予約する」ボタンに付与する。

---

## 4. 技術スタック

| レイヤ | 採用技術 | 理由 |
|---|---|---|
| フレームワーク | **Nuxt 4** | 要件指定。SSR + Server Routes が1つで完結 |
| 言語 | TypeScript | 型安全 |
| 認証/DB | **Supabase** (@nuxtjs/supabase) | 要件指定。Auth + Postgres + RLSが揃う |
| バリデーション | **Zod** + **VeeValidate**(@vee-validate/zod) | 要件指定。フロント・サーバで同一スキーマ |
| CSS | **SCSS** | 要件指定。Vue SFCの `<style lang="scss">` で記述 |
| CSV | papaparse | バルクimport / sample csv生成 |

### バージョン固定方針

`package.json` で `^` ではなく `~` 推奨(機内環境で破壊的変更を踏まない)。一度動いた構成は固定する。

---

## 5. アーキテクチャ・ディレクトリ構成

Nuxt 4 の `app/` ディレクトリ構成 + 共通レイアウトを `app/layouts/` に置く。

```
ana-pp-tracker/
├── README.md                       ← このファイル
├── nuxt.config.ts
├── package.json
├── tsconfig.json
├── .env.local                      ← Supabaseキー(gitignore)
│
├── app/
│   ├── app.vue                     ← <NuxtLayout><NuxtPage/></NuxtLayout>
│   │
│   ├── layouts/                    ← 共通レイアウト(要件)
│   │   ├── default.vue             ← ヘッダ・ナビ・フッタ込み(ログイン後の主レイアウト)
│   │   └── auth.vue                ← ログイン/サインアップ用の最小レイアウト
│   │
│   ├── pages/                      ← ルーティング
│   │   ├── index.vue               ← ダッシュボード(PP累計 / 50k残り / 路線サジェスト)
│   │   ├── login.vue               ← ログイン / サインアップ (layout: 'auth') — Email + パスワード
│   │   ├── confirm.vue             ← メール確認リンクのコールバック(サインアップ後の戻り先)
│   │   ├── flights/
│   │   │   ├── index.vue           ← フライト一覧 + レビュー閲覧
│   │   │   ├── new.vue             ← 新規登録フォーム
│   │   │   └── [id].vue            ← 詳細/編集
│   │   ├── import.vue              ← CSVインポート + サンプルDL
│   │   └── routes.vue              ← 路線テーブル(エコノミー/ファースト切替)
│   │
│   ├── components/
│   │   ├── pp/
│   │   │   ├── PPSummaryCard.vue   ← 現在PP・残PP・プログレスバー
│   │   │   ├── PPGoalHint.vue      ← 「FUK-OKAなら あと X 往復」
│   │   │   └── RouteCard.vue       ← 路線1件のカード(予約リンク付き)
│   │   ├── flight/
│   │   │   ├── FlightForm.vue      ← 登録フォーム(VeeValidate + Zod)
│   │   │   ├── FlightListItem.vue  ← 一覧の1行
│   │   │   └── RatingStars.vue     ← ★1〜5
│   │   ├── import/
│   │   │   ├── CsvDropzone.vue
│   │   │   └── CsvPreviewTable.vue
│   │   └── ui/
│   │       ├── BaseButton.vue
│   │       ├── BaseField.vue       ← VeeValidateフィールド共通ラッパ
│   │       ├── BaseSelect.vue
│   │       └── HeaderNav.vue
│   │
│   ├── composables/
│   │   ├── useFlights.ts           ← /api/flights を叩く
│   │   ├── usePPStats.ts           ← 累計・残量・サジェスト算出
│   │   └── useCsv.ts               ← papaparse ラッパ
│   │
│   ├── assets/
│   │   └── styles/
│   │       ├── _tokens.scss        ← カラー・タイポ等のトークン
│   │       ├── _mixins.scss        ← レスポンシブ等
│   │       ├── _reset.scss
│   │       └── main.scss           ← @use で集約してエントリ
│   │
│   └── middleware/
│       └── auth.global.ts          ← 未ログインなら/loginへ(@nuxtjs/supabaseのredirectOptionsで代替可)
│
├── shared/                         ← フロント・サーバ共有(Nuxt4の標準ディレクトリ)
│   ├── routes.ts                   ← 3章の路線テーブル
│   ├── schema.ts                   ← Zodスキーマ(FlightInput等)
│   └── pp.ts                       ← PP集計・サジェストロジック
│
├── server/
│   ├── api/
│   │   ├── flights/
│   │   │   ├── index.get.ts        ← 一覧(クエリ: year, limit)
│   │   │   ├── index.post.ts       ← 新規登録
│   │   │   ├── [id].get.ts
│   │   │   ├── [id].patch.ts
│   │   │   └── [id].delete.ts
│   │   ├── flights/import.post.ts  ← CSVバルクインポート
│   │   ├── flights/sample-csv.get.ts ← サンプルCSVのDL
│   │   └── stats/summary.get.ts    ← 累計PP・残量・サジェスト
│   └── utils/
│       └── supabase.ts             ← serverSupabaseClient ラッパ
│
└── supabase/
    └── migrations/
        └── 20260101000000_create_flights.sql
```

### 主要設定: `nuxt.config.ts`

```ts
export default defineNuxtConfig({
  compatibilityDate: '2026-01-01',
  future: { compatibilityVersion: 4 },

  modules: ['@nuxtjs/supabase', '@vee-validate/nuxt'],

  supabase: {
    redirectOptions: {
      login: '/login',
      callback: '/confirm',
      include: ['/', '/flights', '/flights/**', '/import', '/routes'],
      exclude: ['/login', '/confirm'],
    },
  },

  veeValidate: {
    autoImports: true,
  },

  imports: {
    dirs: ['shared'],
  },

  css: ['~/assets/styles/main.scss'],

  vite: {
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: '@use "~/assets/styles/_tokens.scss" as *;',
        },
      },
    },
  },
})
```

---

## 6. データベース設計(Supabase)

### テーブル: `flights`

ユーザごとに搭乗1件 = 1行(片道単位)。往復は2行で表現する。

| カラム | 型 | NULL | 説明 |
|---|---|---|---|
| id | uuid | NOT NULL | PK, `gen_random_uuid()` |
| user_id | uuid | NOT NULL | `auth.users(id)` 参照, ON DELETE CASCADE |
| flown_at | date | NOT NULL | 搭乗日 |
| flight_number | text | NULL | 例: NH256 |
| from_airport | text(3) | NOT NULL | IATAコード |
| to_airport | text(3) | NOT NULL | IATAコード |
| cabin | text | NOT NULL | `'economy' \| 'first'` |
| fare_type | text | NULL | 'standard' / 'flex' / 'simple' / 'sale' 等(将来拡張) |
| pp | integer | NOT NULL | 積算PP。テーブルから自動計算、ユーザ上書き可 |
| aircraft | text | NULL | 例: B787-9, A321neo |
| seat | text | NULL | 例: 1A |
| lounge | text | NULL | 利用ラウンジ名 |
| rating_seat | smallint | NULL | 1〜5 |
| rating_aircraft | smallint | NULL | 1〜5 |
| rating_lounge | smallint | NULL | 1〜5 |
| notes | text | NULL | 自由記述 |
| created_at | timestamptz | NOT NULL | `now()` |

### マイグレーション SQL(コピペ用)

```sql
-- supabase/migrations/20260101000000_create_flights.sql

create table if not exists public.flights (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  flown_at        date not null,
  flight_number   text,
  from_airport    text not null check (char_length(from_airport) = 3),
  to_airport      text not null check (char_length(to_airport) = 3),
  cabin           text not null check (cabin in ('economy', 'first')),
  fare_type       text,
  pp              integer not null check (pp >= 0),
  aircraft        text,
  seat            text,
  lounge          text,
  rating_seat     smallint check (rating_seat between 1 and 5),
  rating_aircraft smallint check (rating_aircraft between 1 and 5),
  rating_lounge   smallint check (rating_lounge between 1 and 5),
  notes           text,
  created_at      timestamptz not null default now()
);

create index if not exists flights_user_flown_at_idx
  on public.flights (user_id, flown_at desc);

-- RLS
alter table public.flights enable row level security;

create policy "flights: owner can select"
  on public.flights for select using (auth.uid() = user_id);

create policy "flights: owner can insert"
  on public.flights for insert with check (auth.uid() = user_id);

create policy "flights: owner can update"
  on public.flights for update
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "flights: owner can delete"
  on public.flights for delete using (auth.uid() = user_id);
```

---

## 7. API仕様(Nuxt Server Routes)

すべて `server/api/` 配下。認証は `serverSupabaseUser(event)` で取得し、未認証なら 401。

### 共通エラーレスポンス

```ts
// utils
throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
throw createError({ statusCode: 400, statusMessage: 'Validation failed', data: { issues } })
```

### 7-1. `GET /api/flights`

クエリ: `year` (default 当年), `limit` (default 100), `offset` (default 0)

レスポンス:
```ts
{ items: FlightRow[], total: number }
```

### 7-2. `POST /api/flights`

リクエスト Body: `flightInputSchema` (Zod, 後述)
サーバ側で:
1. Zodで検証
2. `pp` が未指定なら `shared/routes.ts` のテーブルから自動算出してセット
3. `user_id` は `auth.uid()` から
4. insertしたレコードを返す

### 7-3. `GET /api/flights/[id]` / `PATCH /api/flights/[id]` / `DELETE /api/flights/[id]`

標準的なCRUD。RLSが本人のみアクセスを保証。

### 7-4. `POST /api/flights/import`

CSVバルクインポート。リクエストは `multipart/form-data` で CSV ファイル。

処理:
1. PapaParseでヘッダ付きパース
2. 各行を `flightInputSchema` で検証
3. 1件でも検証エラーがあれば「rowごとのエラー」を返してロールバック(`{ ok: false, errors: [{ row, issues }] }`)
4. 全部OKなら `supabase.from('flights').insert(rows)` でバルクINSERT、`{ ok: true, inserted: n }` を返す

### 7-5. `GET /api/flights/sample-csv`

レスポンスヘッダ: `Content-Type: text/csv; charset=utf-8`, `Content-Disposition: attachment; filename="ana-pp-sample.csv"`

サンプルCSV内容(後述 9章):

```csv
flown_at,flight_number,from_airport,to_airport,cabin,fare_type,pp,aircraft,seat,lounge,rating_seat,rating_aircraft,rating_lounge,notes
2026-04-10,NH256,HND,FUK,economy,standard,,B787-9,12A,ANA LOUNGE 羽田,4,5,4,午前便でスムーズ
2026-04-12,NH257,FUK,HND,first,standard,,B787-9,1A,,5,5,,
```

### 7-6. `GET /api/stats/summary`

レスポンス:
```ts
{
  year: number
  totalPP: number
  goalPP: 50000
  remainingPP: number
  progress: number               // 0〜1
  flightsCount: number
  suggestions: Array<{
    from: AirportCode
    to: AirportCode
    cabin: CabinClass
    ppRoundTrip: number
    roundTripsNeeded: number
  }>
}
```

`suggestions` は福岡・那覇・羽田起点の主要路線について「あと何往復で50,000に届くか」を返す。

### Zodスキーマ(`shared/schema.ts` 抜粋)

```ts
import { z } from 'zod'

export const airportCodeSchema = z.enum([
  'HND','NRT','FUK','OKA','CTS','ITM','KIX','NGO','SDJ','HIJ',
  'KMJ','KOJ','NGS','MYJ','OKJ','HKD','ISG','MMY','KMI','OIT',
])

export const cabinClassSchema = z.enum(['economy', 'first'])

export const flightInputSchema = z.object({
  flown_at: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  flight_number: z.string().trim().max(10).optional().or(z.literal('')),
  from_airport: airportCodeSchema,
  to_airport: airportCodeSchema,
  cabin: cabinClassSchema,
  fare_type: z.string().optional().nullable(),
  pp: z.number().int().min(0).max(20000).optional().nullable(),
  aircraft: z.string().trim().max(40).optional().or(z.literal('')),
  seat: z.string().trim().max(10).optional().or(z.literal('')),
  lounge: z.string().trim().max(40).optional().or(z.literal('')),
  rating_seat: z.number().int().min(1).max(5).optional().nullable(),
  rating_aircraft: z.number().int().min(1).max(5).optional().nullable(),
  rating_lounge: z.number().int().min(1).max(5).optional().nullable(),
  notes: z.string().trim().max(2000).optional().or(z.literal('')),
}).refine(d => d.from_airport !== d.to_airport, {
  path: ['to_airport'], message: '出発地と到着地が同じです',
})

export type FlightInput = z.infer<typeof flightInputSchema>
```

---

## 8. 画面仕様

### 8-1. `/login` (layout: auth)

- **Email + パスワードのみ**(MVPの最速実装方針)
- 同一画面に「ログイン / 新規登録」のタブ(または切替リンク)を置く
  - ログイン: `supabase.auth.signInWithPassword({ email, password })`
  - 新規登録: `supabase.auth.signUp({ email, password })` → 確認メールが届く → リンクを踏むと `/confirm` に戻り、セッションが張られて `/` へ
- バリデーションは VeeValidate + Zod(email形式、パスワードは最低8文字)
- 「Googleで続ける」等のソーシャルログインはMVPではスコープ外(将来の拡張ポイントとして余白だけ残す)

> **メモ**: Supabaseダッシュボードの **Authentication → Providers → Email** で「Confirm email」が ON の場合、サインアップ直後はセッションが張られず、ユーザがメール内のリンクを踏むまでログイン状態にならない。検証を素早くしたいだけなら一時的に OFF にしてもよいが、本番想定では ON のままにする。

### 8-2. `/` ダッシュボード

3つのブロックを縦に並べる:

1. **PP累計サマリ** (`PPSummaryCard`)
   - 大きく「12,438 / 50,000 PP」
   - プログレスバー(24.8%)
   - 当年のフライト件数

2. **目標までのサジェスト** (`PPGoalHint` x N)
   - 「あと 37,562 PP」
   - 拠点別 × エコノミー/ファーストで上位3サジェスト
     - 例: 「OKA ⇄ CTS(エコノミー) なら **あと 8 往復**」
     - 例: 「HND ⇄ FUK(ファースト) なら **あと 11 往復**」

3. **直近のフライト** (上位5件)
   - `FlightListItem` のリスト

ナビゲーション: ヘッダから `/flights` `/routes` `/import` へ。

### 8-3. `/routes` 路線テーブル

- 拠点タブ: `[ 羽田 ] [ 福岡 ] [ 沖縄 ]`
- クラス切替: `[ エコノミー ] [ ファースト ]`
- `RouteCard` のグリッド表示
  - 行先・基本マイル・片道PP・往復PP
  - 「ANAで予約」ボタン → 予約サイトへ外部リンク

### 8-4. `/flights` 一覧

- フィルタ: 年 / 拠点 / クラス
- 並び: 搭乗日 DESC
- 各行に PP / レーティング(★★★★☆)を表示
- 「+ 新規登録」ボタン → `/flights/new`

### 8-5. `/flights/new` (`/flights/[id]` でも兼用)

`FlightForm` 1枚。VeeValidate + Zod。

入力欄:
- 搭乗日(date input)
- 便名(text)
- 出発 / 到着(select)
- クラス(radio: エコノミー / ファースト) — **既定値は「ファースト」**
- 運賃種別(select, 任意) — MVPでは未使用でもUIには置く。**既定値は「シンプル」**
- PP(number, 任意) — 空欄なら路線テーブルから自動計算(ファーストはシンプル運賃基準)
- 機体(text)
- 座席(text)
- ラウンジ(text)
- レーティング × 3(★1〜5)
- メモ(textarea)

「保存」 → POST `/api/flights` → 成功で `/flights` に戻る。

### 8-6. `/import` CSVインポート

- 「サンプルCSVをダウンロード」ボタン → `GET /api/flights/sample-csv`
- ドラッグ&ドロップ or ファイル選択
- パース後にプレビュー表(エラーは赤行)
- 「N件をインポート」ボタン → `POST /api/flights/import`

---

## 9. CSVインポート仕様

### 9-1. サンプルCSV

```csv
flown_at,flight_number,from_airport,to_airport,cabin,fare_type,pp,aircraft,seat,lounge,rating_seat,rating_aircraft,rating_lounge,notes
2026-04-10,NH256,HND,FUK,economy,standard,,B787-9,12A,ANA LOUNGE 羽田,4,5,4,午前便でスムーズ
2026-04-12,NH257,FUK,HND,first,standard,,B787-9,1A,,5,5,,
2026-05-03,NH463,HND,OKA,economy,standard,,A321neo,28K,,3,4,,
2026-05-05,NH468,OKA,HND,economy,standard,,B777-200,42A,ANA LOUNGE 那覇,3,4,4,離島から戻り
```

### 9-2. ヘッダ仕様

- 必須: `flown_at` `from_airport` `to_airport` `cabin`
- 任意: それ以外
- `pp` 空欄 → サーバが自動計算
- `flown_at` は `YYYY-MM-DD`
- `cabin` は `economy` or `first` のみ

### 9-3. エラー時のレスポンス例

```json
{
  "ok": false,
  "errors": [
    { "row": 2, "issues": [{ "path": ["from_airport"], "message": "Invalid airport code: HXX" }] },
    { "row": 4, "issues": [{ "path": ["cabin"], "message": "Invalid enum value" }] }
  ]
}
```

エラーが1件でもあれば全件ロールバック(部分インポートはMVPでは不可)。

---

## 10. デザイントーン

> 詳細スタイルはSCSSで実装する。ここではトーンの方向性のみ定義する。

### コンセプト

「ANAブランドカラー寄り・上品・航空ブランドらしい清潔感」。ダッシュボード的に情報を整理しつつ、機内のラベルや搭乗券にあるような **タイポグラフィの落ち着き** を出す。

### キーワード

- 静か / 余白広め / 直線基調 / 軽いセリフ
- 過度な装飾なし、影は控えめ
- 「機内誌」「搭乗券」「空港案内サイン」のニュアンス

### カラーパレット

| トークン名 | 色 | 用途 |
|---|---|---|
| `--ana-deep` | `#002244` | 見出し / プライマリボタン背景 |
| `--ana-primary` | `#13448F` | リンク / アクセント |
| `--ana-bright` | `#1E5BC6` | ホバー / フォーカスリング |
| `--ana-sky` | `#6B9BD8` | サブテキスト |
| `--ana-mist` | `#E8EEF7` | カード薄背景 |
| `--ana-paper` | `#FAFBFD` | ページ背景 |
| `--ana-gold` | `#B89B5E` | ファーストクラス / 上位ステイタス |
| `--ana-red` | `#D63340` | エラー / 警告 |
| `--ink` | `#0A1628` | 本文 |
| `--ink-soft` | `#3A4A63` | 本文セカンダリ |
| `--ink-mute` | `#6A788A` | キャプション |
| `--line` | `#DCE3ED` | ボーダー |

### タイポグラフィ

- ディスプレイ(見出し): **Cormorant Garamond**(serif、エディトリアル感)
- 和文・本文: **Noto Sans JP**(300/400/500/700)
- 数値・コード: **JetBrains Mono**(PP値・空港コードを引き締める)

> Google Fonts から読み込む。機内ではフォールバック(serif / sans-serif / monospace)で表示されるが視認性は確保される。

### レイアウト原則

- 最大幅 1200px の中央寄せ
- カード: `border: 1px solid var(--line)`、角丸2〜6px、影は薄く
- グリッド: モバイル1カラム → 768px〜 2〜3カラム
- ヘッダは白背景に細い下線、左にロゴテキスト + 右にナビ

### モーション

- 控えめに。`transition: .18s ease` 程度
- ページ遷移時の派手なアニメは入れない
- プログレスバーだけは `transition: width .6s ease-out` で気持ちよく伸びる

### SCSSファイル分割方針

```
assets/styles/
├── _tokens.scss     ← :root のCSS変数定義 + SCSS変数(色・余白・ブレークポイント)
├── _mixins.scss     ← @mixin respond-to($bp) など
├── _reset.scss      ← 軽量リセット
└── main.scss        ← @use で _reset _tokens _mixins を集約 + グローバルスタイル
```

`nuxt.config.ts` の `vite.css.preprocessorOptions.scss.additionalData` で `_tokens.scss` を全SFCに自動注入する。各Vueコンポーネントの `<style lang="scss" scoped>` でトークンをそのまま参照できる。

### コンポーネント単位のスタイル

各 Vue コンポーネントの `<style lang="scss" scoped>` 内で完結させる。`assets/styles/` には**グローバルに必要なもの(リセット・トークン・ミックスイン)だけ**を置く方針。

---

## 11. 実装順序(オフラインでも詰まらない順番)

機内で進める時の推奨順。各ステップで「動くもの」が出来上がっていく。

### Step 1: 土台(20分)

1. `pnpm dlx nuxi init` → 依存インストール
2. `nuxt.config.ts` 設定(SCSS追加注入、@nuxtjs/supabase、@vee-validate/nuxt)
3. `app/assets/styles/` の SCSSファイル4つを作成
4. `app/layouts/default.vue` `app/layouts/auth.vue` のシェルを作成

### Step 2: shared定数(15分)

1. `shared/routes.ts` に 3章の路線テーブルを全部書き出す
2. `shared/schema.ts` にZodスキーマ
3. `shared/pp.ts` に `calcPP()`, `roundTripsNeeded()`, `getSuggestions()` を実装

### Step 3: 認証(10分・Supabase設定済み前提)

1. `app/pages/login.vue` に Email + パスワードのフォーム(ログイン / 新規登録の切替つき)
   - `signInWithPassword` / `signUp` を直接叩く。Google OAuthはMVPでは実装しない
2. `app/pages/confirm.vue` でメール確認リンクのコールバック(セッション成立を待って `/` にリダイレクト)
3. `nuxt.config.ts` の `supabase.redirectOptions` で保護ルート設定

### Step 4: 一覧と登録(60分)

1. `server/api/flights/index.get.ts`, `index.post.ts`, `[id].patch.ts`, `[id].delete.ts`
2. `app/pages/flights/index.vue` で一覧
3. `app/pages/flights/new.vue` で `FlightForm.vue`(VeeValidate + Zod)
4. 1件登録 → 一覧表示まで通す

### Step 5: ダッシュボード(30分)

1. `server/api/stats/summary.get.ts` で集計
2. `app/pages/index.vue` で `PPSummaryCard` + `PPGoalHint`
3. プログレスバーのアニメーションを入れる

### Step 6: 路線テーブル(20分)

1. `app/pages/routes.vue`
2. 拠点タブ + クラス切替 + `RouteCard` のグリッド

### Step 7: CSVインポート(30分)

1. `server/api/flights/sample-csv.get.ts`
2. `server/api/flights/import.post.ts`
3. `app/pages/import.vue` で UI

### Step 8: 仕上げ(任意)

- レビュー記入の動線整理
- スマホレイアウト微調整
- フッタに「公式数値と100%一致しない可能性」の注記

---

## 12. トラブルシューティング

### `@nuxtjs/supabase` で `Cannot find module` が出る
→ `pnpm install` を `node_modules` 削除後にやり直す。

### メール確認リンクを踏んでも `/login` に戻されてしまう
→ Supabase ダッシュボードの **Authentication → URL Configuration** で Site URL に `http://localhost:3000` を、Redirect URLs に `http://localhost:3000/confirm` を追加。`@nuxtjs/supabase` 側は `redirectOptions.callback = '/confirm'` と整合させる。

### サインアップ直後にログイン画面に戻されてしまう
→ Email Confirm が ON だと、メール内のリンクを踏むまでセッションが張られない。挙動として正しい。確認リンクを踏ませる導線(「確認メールを送りました」というメッセージ)を `/login` に出すこと。手早く検証だけしたいなら **Authentication → Providers → Email** の Confirm email を一時的に OFF にする手もある。

### 「`auth.uid()` が null」とRLSではじかれる
→ Server Routes 側で `serverSupabaseClient(event)` を使う(`serverSupabaseServiceRole` ではない)。RLS下のクライアントは認証Cookieを引き継ぐ。

### SCSSの `@import` が deprecated 警告を出す
→ Dart Sassの最新仕様。`@use` `@forward` に書き換える。`additionalData` も `@use ... as *;` を推奨。

### CSVの日本語が文字化け
→ Papaparseに `encoding: 'utf-8'` を明示。Excelで開くBOM対策で、サンプルCSVの先頭に BOM(`\uFEFF`)を入れる手もある。

### 機内Wi-Fiが死んだ
→ Supabase本番APIは当然届かないので、 **`supabase start` (Supabase CLI)** でローカルSupabaseを離陸前に立ち上げておくと完全オフラインで開発できる。`.env.local` をローカル用に切り替えてどうぞ。

---

## 付録: 参考リンク

- ANA プレミアムポイント: https://www.ana.co.jp/ja/jp/amc/premium/overview/premium-point/
- ANA 国内線マイレージチャート: https://www.ana.co.jp/ja/jp/amc/flightmile/dom/chart/
- ANA 国内線運賃別積算率: https://www.ana.co.jp/ja/jp/amc/flightmile/dom/
- Nuxt 4: https://nuxt.com/docs/4.x
- @nuxtjs/supabase: https://supabase.nuxtjs.org/
- VeeValidate × Zod: https://vee-validate.logaretm.com/v4/integrations/zod-schema-validation/
- Supabase Auth (Email + Password): https://supabase.com/docs/guides/auth/passwords