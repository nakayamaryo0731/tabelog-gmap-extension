# 食べログページからGoogle Mapの評価を確認できるChrome拡張機能を作った

## TL;DR

- 食べログの店舗ページに「Google Mapで見る」ボタンを追加するChrome拡張機能を作った
- APIキーを設定すればGoogle Mapの評価を直接表示することも可能
- Vite + TypeScript + CRXJS で開発、Manifest V3対応

👉 [Chrome Web Store](リンク)

---

## 作ったきっかけ

食べログでお店を探しているとき、「Google Mapの評価も気になる...」と思うことはありませんか？

私はよくあります。食べログの評価は参考になりますが、Google Mapの口コミも見たい。でも毎回店名をコピーしてGoogle Mapで検索するのは面倒...

というわけで、ワンクリックでGoogle Mapを開ける拡張機能を作りました。

---

## 機能紹介

### 1. リンクモード（設定不要）

インストールするだけで使えます。

食べログの店舗ページを開くと、店名の横に「Google Mapで見る」ボタンが表示されます。クリックすると新しいタブでGoogle Mapの検索結果が開きます。

![リンクモードのスクリーンショット](画像)

### 2. 評価表示モード（APIキーが必要）

Google Places APIキーを設定すると、Google Mapの評価（★と口コミ数）を食べログのページに直接表示できます。

![評価表示モードのスクリーンショット](画像)

わざわざGoogle Mapを開かなくても、両方の評価を比較できて便利です。

---

## 技術スタック

- **TypeScript** - 型安全な開発
- **Vite** - 高速なビルド
- **@crxjs/vite-plugin** - Chrome拡張のHMR対応
- **Chrome Extension Manifest V3** - 最新のマニフェスト仕様

### プロジェクト構成

```
src/
├── content/          # 食べログページに注入されるスクリプト
│   ├── index.ts      # メインロジック
│   ├── parser.ts     # DOM解析（店名・住所抽出）
│   ├── ui.ts         # UI注入
│   └── styles.css
├── background/       # Service Worker
│   ├── service-worker.ts
│   └── places-api.ts # Google Places API呼び出し
├── options/          # 設定ページ
├── popup/            # ポップアップUI
└── utils/            # ユーティリティ
```

---

## 実装のポイント

### 1. 食べログのDOM解析

店名と住所を取得するため、食べログのHTML構造を解析しています。

```typescript
// 店名を取得
const nameElement = document.querySelector('.display-name');
const name = nameElement?.textContent?.trim();

// 住所を取得（複雑なHTML構造のため再帰的に収集）
const addressElement = document.querySelector('.rstinfo-table__address');
```

住所のHTML構造が複雑だったので、テキストノードを再帰的に収集する処理を実装しました。

### 2. Google Places API (New) の利用

Google Places APIの新バージョン（Places API New）を使用しています。

```typescript
const response = await fetch('https://places.googleapis.com/v1/places:searchText', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Goog-Api-Key': apiKey,
    'X-Goog-FieldMask': 'places.rating,places.userRatingCount,places.googleMapsUri',
  },
  body: JSON.stringify({
    textQuery: `${name} ${address}`,
    maxResultCount: 1,
    languageCode: 'ja',
  }),
});
```

旧APIとは異なり、FieldMaskで必要なフィールドだけを指定する方式です。

### 3. キャッシュ戦略

API呼び出しを減らすため、取得した評価情報をキャッシュしています。

- **保存先**: `chrome.storage.local`
- **TTL**: 7日間
- **最大件数**: 500件（古いものから削除）

### 4. セキュリティ対策

公開前にセキュリティレビューを実施し、以下の対策を行いました。

#### XSS対策: innerHTMLを使わない

当初は`innerHTML`でUIを構築していましたが、DOM APIに置き換えました。

```typescript
// Before（リスク有り）
container.innerHTML = `<a href="${url}">リンク</a>`;

// After（安全）
const link = document.createElement('a');
link.href = url;
link.textContent = 'リンク';
container.appendChild(link);
```

#### URL検証

`javascript:`などの危険なURLをブロックする検証を追加。

```typescript
function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}
```

#### 最小限の権限

manifest.jsonの権限は必要最小限に抑えています。

```json
{
  "permissions": ["storage"],
  "host_permissions": ["https://places.googleapis.com/*"]
}
```

---

## 開発環境のセットアップ

### CRXJS が便利

Chrome拡張の開発には[@crxjs/vite-plugin](https://crxjs.dev/vite-plugin)を使いました。

- manifest.jsonからエントリポイントを自動検出
- Content ScriptのHMR対応
- TypeScriptのパスエイリアス対応

```typescript
// vite.config.ts
import { crx } from '@crxjs/vite-plugin';
import manifest from './manifest.json';

export default defineConfig({
  plugins: [crx({ manifest })],
});
```

### 開発フロー

```bash
# 開発モード（HMR有効）
pnpm dev

# ビルド
pnpm build

# Chromeに読み込み
# chrome://extensions → デベロッパーモード → 「パッケージ化されていない拡張機能を読み込む」→ distフォルダを選択
```

---

## Chromeウェブストアへの公開

### 必要なもの

1. **開発者登録** - $5（一度だけ）
2. **ZIP化した拡張機能**
3. **ストア用画像**
   - スクリーンショット（1280×800）
   - プロモーション画像（440×280）
   - ストアアイコン（128×128）

### プライバシーポリシーの記載

審査では権限の使用理由を説明する必要があります。

```
storage: APIキーとキャッシュの保存に使用
host_permissions: Google Places APIへのアクセスに使用
```

---

## 料金について

### 拡張機能自体は無料

リンクモードは完全無料で使えます。

### 評価表示モード

Google Places APIの料金が発生しますが、月$200の無料クレジットがあるため、個人利用では実質無料です。

- Text Search: $5 / 1,000リクエスト
- 月40,000リクエストまで無料

---

## まとめ

- 食べログとGoogle Mapの評価を簡単に比較できる拡張機能を作った
- Manifest V3 + TypeScript + Viteで快適に開発できた
- セキュリティを意識した実装が重要（innerHTML避ける、URL検証など）

よければ使ってみてください！

👉 [Chrome Web Store](リンク)
👉 [GitHub](リンク)

---

## 参考リンク

- [Chrome Extension 公式ドキュメント](https://developer.chrome.com/docs/extensions/)
- [CRXJS Vite Plugin](https://crxjs.dev/vite-plugin)
- [Google Places API (New)](https://developers.google.com/maps/documentation/places/web-service/text-search)
