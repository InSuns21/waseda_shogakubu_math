# 早稲田大学 商学部 数学 過去問 解答解説

早稲田大学 商学部の数学過去問（2001〜2026年）について、問題文と解答・解説を年別に整理したリポジトリです。

## Web で読む

GitHub Pages から、ブラウザ上で KaTeX による数式表示付きの教材を閲覧できます。

- GitHub Pages: https://insuns21.github.io/waseda_shogakubu_math/
- 解答解説一覧: https://insuns21.github.io/waseda_shogakubu_math/#/answers
- 問題文一覧: https://insuns21.github.io/waseda_shogakubu_math/#/problems

GitHub Pages の Source は **GitHub Actions** を使用します。

## ディレクトリ構成

```text
.
├── ans/                  # 年別の解答・解説 Markdown
├── probrems/             # 年別の問題文 Markdown
├── site/                 # GitHub Pages 用の Docsify 設定・索引
├── scripts/              # 数式記法の移行・CI 検証スクリプト
└── .github/workflows/    # KaTeX 検証・Pages 公開
```

## 解答・解説

`ans/2001.md` 〜 `ans/2026.md` に年別の解答・解説を置いています。GitHub Pages ではこの Markdown を直接読み込みます。

解答部分は Web 上では初期状態で折りたたまれ、「解答を見る」を押すと展開されます。Markdown 原文には表示専用の `<details>` を埋め込まず、表示ロジックは `site/index.html` 側で管理します。

## 問題文

`probrems/2001.md` 〜 `probrems/2026.md` に年別の問題文を置いています。

## 数式表記

このリポジトリでは Pages / Docsify / KaTeX で安定して表示するため、数式区切りを次に統一します。

- インライン数式: `$...$`
- ディスプレイ数式: `$$...$$`

`\\(...\\)` と `\\[...\\]` は使用しません。これらは KaTeX 自体では有効な区切りですが、現在利用している Docsify の数式プラグインでは安定して認識されず、Web ページ上で数式がそのまま文字列として表示される原因になるためです。

## KaTeX CI

Markdown の更新時には GitHub Actions の `Validate KaTeX` が次を検証します。

1. `\\(...\\)` / `\\[...\\]` が残っていないこと
2. `$...$` / `$$...$$` の数式を KaTeX が実際にパースできること
3. 閉じていない数式区切りや KaTeX 構文エラーがないこと

ローカルでは次のコマンドで検証できます。

```bash
npm install
npm run check:math-delimiters
npm run validate:katex
```

旧区切りを `$...$` / `$$...$$` に一括移行する場合は次を実行します。

```bash
npm run normalize:math
```

コードブロックおよびインラインコード内は移行対象外です。

## GitHub Pages の仕組み

`Deploy GitHub Pages` workflow は次の順序で処理します。

1. 旧数式区切りが残っていれば Markdown 原文を `$...$` / `$$...$$` に正規化して `main` へコミット
2. 数式区切り規約を検証
3. 全数式を KaTeX で実パース検証
4. `site/`、`ans/`、`probrems/` を Pages artifact にまとめる
5. GitHub Pages へデプロイ

以後は通常どおり `ans/*.md` / `probrems/*.md` を編集すれば Web 側にも反映されます。

## 注意

問題文には OCR に由来する誤りが含まれる可能性があります。明らかな OCR 誤りを補正して解いている箇所は、各年の解答解説 Markdown 内に注記します。

## Repository

https://github.com/InSuns21/waseda_shogakubu_math
