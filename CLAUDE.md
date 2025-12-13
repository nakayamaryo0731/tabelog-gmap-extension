# 食べログ × Google Map Chrome拡張機能

## プロジェクト概要

食べログの店舗ページにGoogle Mapへのリンクボタンを追加し、オプションでGoogle Mapの評価を直接表示するChrome拡張機能。

## 技術スタック

- TypeScript
- Vite + @crxjs/vite-plugin
- Chrome Extension Manifest V3
- Google Places API (New)

## ディレクトリ構成

```
src/
├── content/          # Content Script（食べログページに注入）
├── background/       # Service Worker（API呼び出し）
├── options/          # 設定ページ
├── popup/            # ポップアップUI
├── types/            # 型定義
└── utils/            # ユーティリティ
```

## よく使うコマンド

```bash
pnpm dev      # 開発モード（HMR）
pnpm build    # プロダクションビルド
pnpm lint     # Lint実行
```

## 2つの動作モード

1. **リンクモード**（デフォルト）: APIキー不要、ボタンクリックでGoogle Mapを開く
2. **評価表示モード**: Google Places APIキー設定時、評価を直接表示

## セキュリティ方針

- `innerHTML`は使用禁止 → DOM APIを使用
- URLは`http:`/`https:`のみ許可（`isValidUrl`で検証）
- 権限は最小限（`storage`と`places.googleapis.com`のみ）
- APIキーは`chrome.storage.local`に保存、外部送信しない

## Chrome拡張のロード方法

1. `pnpm build`
2. `chrome://extensions` → デベロッパーモードON
3. 「パッケージ化されていない拡張機能を読み込む」→ `dist`フォルダ選択

## ストア用画像の生成

```bash
node scripts/capture-screenshots.mjs
```

`store-assets/`に画像が生成される。
