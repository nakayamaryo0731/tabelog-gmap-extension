# 食べログ × Google Map

食べログの店舗ページにGoogle Mapの評価を表示するChrome拡張機能

## 機能

- **リンクモード（デフォルト）**: 食べログページに「Google Mapで見る」ボタンを追加
- **評価表示モード**: Google Places APIを使って評価（星・レビュー数）を直接表示

## インストール

### 開発版（ローカル）

#### 1. ビルド

```bash
# 依存関係のインストール
pnpm install

# ビルド
pnpm build
```

#### 2. Chromeに読み込む

1. Chromeのアドレスバーに `chrome://extensions` と入力してEnter
2. 右上の「デベロッパーモード」のトグルをONにする
3. 「パッケージ化されていない拡張機能を読み込む」ボタンをクリック
4. このプロジェクトの `dist` フォルダを選択

#### 3. 更新・リロード

コードを変更した後は：

1. `pnpm build` で再ビルド
2. `chrome://extensions` で拡張機能の更新アイコン（↻）をクリック

### 開発モード（ホットリロード）

```bash
pnpm dev
```

ファイル変更時に自動でリビルドされます。ただし、Chromeへの反映には `chrome://extensions` で更新アイコンをクリックする必要があります。

### デバッグ

- **ポップアップ**: ポップアップを開いて右クリック →「検証」→ Console
- **Content Script**: 食べログのページでF12 → Console（`[Tabelog x Google Map]` で検索）
- **Service Worker**: `chrome://extensions` → 拡張機能の「Service Worker」リンクをクリック

## 使い方

### リンクモード（APIキー不要）

インストール後、食べログの店舗ページを開くと「Google Mapで見る」ボタンが表示されます。
クリックすると新しいタブでGoogle Mapの検索結果が開きます。

### 評価表示モード（APIキーが必要）

1. 拡張機能アイコンをクリック → 「設定を開く」
2. 「評価を表示」を選択
3. Google Places APIキーを入力して「検証」→「保存」

設定後、食べログの店舗ページでGoogle Mapの評価が直接表示されます。

## APIキーの取得方法

1. [Google Cloud Console](https://console.cloud.google.com/) にアクセス
2. プロジェクトを作成（または既存のプロジェクトを選択）
3. 「APIとサービス」→「ライブラリ」から **Places API (New)** を有効化
4. 「APIとサービス」→「認証情報」→「認証情報を作成」→「APIキー」
5. 作成されたAPIキーをコピーして拡張機能の設定画面に貼り付け

月$200の無料クレジットがあるため、個人利用では通常料金は発生しません。

## 技術スタック

- TypeScript
- Vite + @crxjs/vite-plugin
- Chrome Extension Manifest V3

## プロジェクト構成

```text
src/
├── content/          # Content Script（食べログページに注入）
│   ├── index.ts      # メインロジック
│   ├── parser.ts     # DOM解析
│   ├── ui.ts         # UI注入
│   └── styles.css
├── background/       # Service Worker
│   ├── service-worker.ts
│   └── places-api.ts
├── options/          # 設定ページ
├── popup/            # ポップアップ
├── types/            # 型定義
└── utils/            # ユーティリティ
```

## ドキュメント

| ドキュメント | 説明 |
|-------------|------|
| [RESEARCH.md](docs/RESEARCH.md) | 事前調査結果 |
| [DESIGN.md](docs/DESIGN.md) | 設計ドキュメント |
| [OPTION-A-API-KEY.md](docs/OPTION-A-API-KEY.md) | APIキー方式の詳細 |
| [OPTION-B-LINK-ONLY.md](docs/OPTION-B-LINK-ONLY.md) | リンクのみ方式の詳細 |
| [ADR](docs/adr/) | アーキテクチャ決定記録 |

## 参考リンク

- [Chrome拡張機能 公式チュートリアル](https://developer.chrome.com/docs/extensions/get-started/tutorial/hello-world) - Hello World拡張機能の作り方
- [ReactではじめるChrome拡張開発入門](https://zenn.dev/alvinvin/books/chrome_extension) - 日本語の詳しい解説
- [How to Load an Unpacked Chrome Extension](https://devdiggers.com/how-to-load-an-unpacked-chrome-extension/) - ローカル読み込みの詳細手順

## ライセンス

MIT
