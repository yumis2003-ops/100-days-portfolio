# 100日チャレンジ ポートフォリオ

100日間で作ったWebアプリを、スクリーンショット付きの一覧にまとめたサイト。
カードをクリックすると本番のアプリが新しいタブで開く。

- 一覧データ: [`data/apps.json`](data/apps.json) — **ここが全ての元ネタ**
- スクリーンショット: `public/shots/<slug>.webp`
- 画面: [`app/page.tsx`](app/page.tsx) / [`components/Gallery.tsx`](components/Gallery.tsx) / [`components/AppCard.tsx`](components/AppCard.tsx)

技術構成は Next.js 16（App Router）+ Tailwind CSS v4。全ページ静的生成なのでサーバー処理は不要。

---

## 1. 事前準備：Node をこのマシンに入れる

現状このマシンには Node が入っていない（nix 経由でのみ使える状態）。
毎回コマンドの前にこれを実行すれば動く：

```bash
nix shell nixpkgs#nodejs_22
```

このシェルに入ってから、下の `npm ...` を実行する。

恒久的に入れてしまうなら：

```bash
nix profile install nixpkgs#nodejs_22
```

## 2. 動かす

```bash
npm install
npm run build && npm start
```

`http://localhost:3000` で開く。

> `npm run dev`（Turbopackの開発サーバー）は、Node が PATH に無い状態だと
> PostCSS のワーカー起動に失敗して 500 になる。上の手順1でシェルに入っていれば問題ない。

---

## 3. アプリを追加するとき（101日目以降）

### 一番手軽な方法

GitHub に新しいリポジトリを push して Vercel にデプロイしたあと：

```bash
npm run apps:sync
npm run shots:missing
```

- `apps:sync` … GitHub のリポジトリ一覧を見て、`apps.json` に無いものだけ追記する。
  公開URLは `homepage` → `<repo名>.vercel.app` → GitHub Pages の順に実際にアクセスして、
  生きているものを採用する。**既存の title / description / tags は上書きしない**ので、
  手で直した文が消える心配はない。
- `shots:missing` … スクショがまだ無いものだけ撮る。

そのあと `git commit && git push` すれば Vercel が自動で再デプロイする。

### 手で1件足す方法

`data/apps.json` に追記するだけでもよい：

```json
{
  "day": 101,
  "title": "アプリのタイトル",
  "url": "https://example.vercel.app",
  "repo": "https://github.com/yumis2003-ops/example",
  "description": "何ができるアプリかを1〜2行で。",
  "tags": ["ユーティリティ", "TypeScript"],
  "slug": "example",
  "createdAt": "2026-08-01"
}
```

`slug` がスクショのファイル名になる（`public/shots/example.webp`）。

---

## 4. スクリプト一覧

| コマンド | 内容 |
|---|---|
| `npm run build` | 本番ビルド |
| `npm start` | ビルド結果を配信 |
| `npm run shots` | 全アプリのスクショを撮り直す（約5分） |
| `npm run shots:missing` | スクショが無いものだけ撮る |
| `npm run apps:sync` | GitHubから新しいリポジトリを`apps.json`に追記 |
| `node scripts/describe.mjs` | `description` が空のものを、本番ページから拾って埋める |

初回だけ Playwright 用のブラウザが必要：

```bash
npx playwright install chromium
```

### スクショの仕様

1280×800 で撮って幅900pxのWebPに変換している（[`scripts/shots.mjs`](scripts/shots.mjs)）。
99枚で合計1.7MB。PNGのままだと27MBあったので、リポジトリと表示速度のために圧縮している。

撮り直したい1件だけを指定することもできる：

```bash
node scripts/shots.mjs --only slug-name
```

---

## 5. Vercel にデプロイする

1. GitHub にリポジトリを作って push する

```bash
git init
git add .
git commit -m "100日チャレンジのポートフォリオサイト"
gh repo create 100-days-portfolio --public --source=. --push
```

2. [vercel.com/new](https://vercel.com/new) を開いて、いま作ったリポジトリを Import する
3. フレームワークは Next.js が自動で検出される。設定変更は不要。Deploy を押す

`public/shots/` は Git にコミットされているので、Vercel 側でスクショを撮り直す必要はない。

---

## 6. データについての注意点

- **Day番号は「作った順（リポジトリ作成日の昇順）」の連番**。カレンダー上の日付とは一致しない
  （1日に複数個作った日があるため）。並べ替えたい場合は `apps.json` の `day` を直接書き換える。
- **Day 2 の Idea Manager は CLI アプリ**なのでWeb公開URLが無い。
  カードはGitHubリポジトリへのリンクになり、スクショの代わりに `CLI / NO PREVIEW` と表示される。
  `scripts/sync-apps.mjs` の `NOT_WEB` に列挙している。
- 公開URLは全件、実際にアクセスして200が返ることを確認済み。
  Vercelが自動採番したドメイン（例: `password-generator` → `simple-memo-pad-eoev.vercel.app`）
  もそのまま採用している。独自に整えたい場合は Vercel 側でドメインを変更してから
  `apps.json` の `url` を書き換える。
