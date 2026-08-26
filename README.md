# 早稲田大学 商学部 数学 過去問 解答解説

早稲田大学 商学部の数学過去問（2001〜2026年）について、問題文と解答・解説を年別に整理したリポジトリです。

## Web で読む

GitHub Pages から、ブラウザ上で KaTeX による数式表示付きの教材を閲覧できる構成です。

- GitHub Pages: https://insuns21.github.io/waseda_shogakubu_math/
- 解答解説一覧: https://insuns21.github.io/waseda_shogakubu_math/#/answers
- 問題文一覧: https://insuns21.github.io/waseda_shogakubu_math/#/problems

> GitHub Pages を初めて有効化する場合は、Repository Settings → Pages → Build and deployment → Source で **GitHub Actions** を選択してください。

## ディレクトリ構成

```text
.
├── ans/                  # 年別の解答・解説 Markdown
├── probrems/             # 年別の問題文 Markdown
├── site/                 # GitHub Pages 用の Docsify 設定・索引
├── scripts/              # CI 用の検証スクリプト
└── .github/workflows/    # KaTeX 検証・Pages 公開
```

## 解答・解説

`ans/2001.md` 〜 `ans/2026.md` に年別の解答・解説を置いています。GitHub Pages の公開時には、この Markdown をそのままサイトへ配置するため、Web 用本文を別管理する必要はありません。

## 問題文

`probrems/2001.md` 〜 `probrems/2026.md` に年別の問題文を置いています。

## 数式表記と KaTeX 検証

数式は KaTeX で表示することを前提にしています。Markdown の更新時には GitHub Actions の `Validate KaTeX` が走り、`ans/` と `probrems/` 内の `$...$`、`$$...$$`、`\\(...\\)`、`\\[...\\]` を KaTeX で実際にパースします。

ローカルでも次のコマンドで同じ検証を実行できます。

```bash
npm install
npm run validate:katex
```

KaTeX が解釈できないコマンド、閉じていない数式デリミタ、構文エラーがある場合は CI が失敗します。

## GitHub Pages の仕組み

公開には Docsify を利用します。`main` ブランチ更新時に Pages 用ワークフローが次を行います。

1. `site/` を公開用ディレクトリへコピー
2. `ans/` と `probrems/` を同じ公開物へコピー
3. GitHub Pages artifact を作成
4. GitHub Pages へデプロイ

そのため、解答解説は通常どおり `ans/*.md` を編集すれば Web 側にも反映されます。

## 注意

問題文には OCR に由来する誤りが含まれる可能性があります。明らかな OCR 誤りを補正して解いている箇所は、各年の解答解説 Markdown 内に注記します。

## Repository

https://github.com/InSuns21/waseda_shogakubu_math
