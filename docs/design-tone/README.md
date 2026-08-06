# design-tone — デザイン検討用モックアップ

実装前にトーン&マナーを検討するために作ったモックアップ一式。**アプリのビルド対象ではない**。

| ファイル | 内容 |
| --- | --- |
| `index.html` | モックアップの入口。ブラウザで直接開く |
| `design-canvas.jsx` | カラー・タイポグラフィ・コンポーネントのカタログ |
| `screens.jsx` | 各画面のラフ |
| `data.js` | モックアップ用のダミーデータ |
| `styles.css` | モックアップ専用のスタイル |

## 注意

- React/JSX で書かれており、本体（Vue/Nuxt）とはスタックが異なる
- ここのスタイルは本体には反映されない。実際のトークンは `app/assets/styles/_tokens.scss` が正
- ESLint / Prettier の対象からは除外している

## 使い方

```bash
open docs/design-tone/index.html
```
