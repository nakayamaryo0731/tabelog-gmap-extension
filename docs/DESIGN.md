# 設計ドキュメント

## 1. システム概要

### 1.1 アーキテクチャ図

```
┌─────────────────────────────────────────────────────────────┐
│                        Chrome Browser                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐      ┌──────────────┐      ┌───────────┐ │
│  │   食べログ    │      │   Extension   │      │  Google   │ │
│  │    Page      │◄────►│              │◄────►│ Places API│ │
│  │              │      │              │      │           │ │
│  └──────────────┘      └──────────────┘      └───────────┘ │
│         ▲                     │                             │
│         │                     ▼                             │
│         │              ┌──────────────┐                     │
│         └──────────────│   Injected   │                     │
│                        │     UI       │                     │
│                        └──────────────┘                     │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 コンポーネント構成

```
tabelog-gmap-extension/
├── manifest.json           # 拡張機能の設定
├── src/
│   ├── content/
│   │   ├── index.ts       # Content Script エントリポイント
│   │   ├── parser.ts      # 食べログDOM解析
│   │   └── ui.ts          # UI注入
│   ├── background/
│   │   └── service-worker.ts  # API呼び出し
│   ├── types/
│   │   └── index.ts       # 型定義
│   └── utils/
│       └── cache.ts       # キャッシュ処理
├── popup/
│   ├── popup.html         # ポップアップUI
│   └── popup.ts           # ポップアップロジック
└── assets/
    └── icons/             # アイコン
```

---

## 2. データフロー

### 2.1 メインフロー

```
1. ユーザーが食べログの店舗ページを開く
          │
          ▼
2. Content Script が発火
          │
          ▼
3. DOM から店名・住所を抽出
          │
          ▼
4. Background Script に検索リクエスト送信
          │
          ▼
5. Google Places API で店舗検索
          │
          ▼
6. 評価データを Content Script に返却
          │
          ▼
7. ページ内に評価UIを注入・表示
```

### 2.2 シーケンス図

```
User        ContentScript    BackgroundSW     PlacesAPI
 │               │                │               │
 │──open page───►│                │               │
 │               │──parse DOM────►│               │
 │               │                │               │
 │               │──sendMessage──►│               │
 │               │  {name, addr}  │               │
 │               │                │──fetch───────►│
 │               │                │               │
 │               │                │◄──response────│
 │               │◄──response─────│               │
 │               │  {rating, ...} │               │
 │               │                │               │
 │◄──inject UI───│                │               │
 │               │                │               │
```

---

## 3. 主要コンポーネント詳細

### 3.1 Content Script (`content/index.ts`)

**責務**:
- 食べログページの検出
- DOM解析のトリガー
- UIの注入

**発火条件**:
- URL: `*://tabelog.com/*/A*/A*/*`

### 3.2 DOM Parser (`content/parser.ts`)

**責務**:
- 店名の抽出
- 住所の抽出
- 電話番号の抽出（マッチング精度向上用）

**インターフェース**:
```typescript
interface RestaurantInfo {
  name: string;
  address: string;
  phone?: string;
}

function parseRestaurantPage(): RestaurantInfo | null;
```

### 3.3 Service Worker (`background/service-worker.ts`)

**責務**:
- Google Places API との通信
- APIキーの管理
- レスポンスのキャッシュ

**インターフェース**:
```typescript
interface PlaceResult {
  placeId: string;
  name: string;
  rating: number;
  userRatingsTotal: number;
  url: string;
}

async function searchPlace(info: RestaurantInfo): Promise<PlaceResult | null>;
```

### 3.4 UI Component (`content/ui.ts`)

**責務**:
- 評価表示UIの生成
- ページへの注入
- スタイリング

**表示内容**:
- Google Map 評価（星）
- レビュー数
- Google Mapへのリンク

---

## 4. データ設計

### 4.1 Chrome Storage

```typescript
interface StorageSchema {
  // 設定
  settings: {
    enabled: boolean;
    showReviewCount: boolean;
  };

  // キャッシュ（店舗情報）
  cache: {
    [tabelogUrl: string]: {
      placeId: string;
      rating: number;
      userRatingsTotal: number;
      fetchedAt: number;  // timestamp
    };
  };
}
```

### 4.2 キャッシュ戦略

| 項目 | 値 |
|------|-----|
| TTL | 24時間 |
| 最大件数 | 1000件 |
| 削除戦略 | LRU |

---

## 5. UI/UX 設計

### 5.1 表示位置

食べログの評価の横に並べて表示

```
┌─────────────────────────────────────────┐
│  食べログ評価: ★3.52 (123件)           │
│  Google Map:  ★4.2 (456件) ←リンク    │  ← 追加
└─────────────────────────────────────────┘
```

### 5.2 状態別表示

| 状態 | 表示 |
|------|------|
| 読み込み中 | スピナー or 「取得中...」 |
| 成功 | 評価・レビュー数・リンク |
| 店舗見つからず | 「Google Mapに該当なし」 |
| エラー | 「取得失敗」（リトライボタン） |

### 5.3 スタイリング方針

- 食べログのデザインに馴染むスタイル
- Shadow DOM で既存CSSとの干渉を防ぐ

---

## 6. エラーハンドリング

| エラー種別 | 原因 | 対応 |
|-----------|------|------|
| API制限超過 | 無料枠超え | ユーザーに通知、機能停止 |
| ネットワークエラー | 接続不良 | リトライ（3回まで） |
| DOM解析失敗 | ページ構造変更 | エラーログ、graceful degradation |
| 店舗不一致 | 検索精度問題 | 「見つかりません」表示 |

---

## 7. セキュリティ考慮

### 7.1 APIキーの保護

- APIキーはService Worker内で管理
- Content Scriptには露出しない
- リファラ制限を設定

### 7.2 CSP対応

Manifest V3のCSP制約に準拠

---

## 8. 将来の拡張性

### 8.1 Phase 2 候補

- [ ] 検索結果ページ対応
- [ ] 複数の評価サービス対応（Retty等）
- [ ] 評価比較の可視化

### 8.2 設計上の考慮

- Parser は交換可能な設計に
- 評価取得部分を抽象化してプロバイダパターン適用可能に
