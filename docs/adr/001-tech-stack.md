# ADR-001: 技術スタック選定

## ステータス

**提案中** (Proposed)

## コンテキスト

食べログページにGoogle Map評価を表示するChrome拡張機能を開発する。
個人開発プロジェクトとして、メンテナンス性と開発効率のバランスを考慮する必要がある。

## 決定事項

### 1. 言語: TypeScript

**選択肢**:
| 選択肢 | メリット | デメリット |
|--------|---------|-----------|
| JavaScript | 設定不要、シンプル | 型安全性なし |
| TypeScript | 型安全、IDE補完、リファクタリング容易 | ビルド設定が必要 |

**決定**: TypeScript

**理由**:
- Chrome拡張はメッセージパッシングが多く、型があると安全
- 個人開発でも将来の自分のためにドキュメント代わりになる
- ビルド設定は一度作れば問題ない

---

### 2. ビルドツール: Vite + CRXJS

**選択肢**:
| 選択肢 | メリット | デメリット |
|--------|---------|-----------|
| webpack | 実績豊富 | 設定が複雑 |
| Vite + CRXJS | 高速、HMR対応、Chrome拡張に特化 | 比較的新しい |
| esbuild直接 | 最速 | Chrome拡張用の設定が手間 |
| なし（生JS） | 設定不要 | TypeScript使えない |

**決定**: Vite + CRXJS

**理由**:
- Chrome拡張開発に特化したプラグイン（CRXJS）がある
- Hot Module Replacement で開発効率が良い
- manifest.json の型チェックも可能

---

### 3. テストフレームワーク: Vitest

**選択肢**:
| 選択肢 | メリット | デメリット |
|--------|---------|-----------|
| Jest | 実績豊富、情報多い | ESM対応がやや面倒 |
| Vitest | Viteと統合、高速、ESMネイティブ | 比較的新しい |
| なし | 設定不要 | 品質担保できない |

**決定**: Vitest

**理由**:
- Viteを使うならVitestが自然な選択
- 設定がほぼ不要
- 個人開発でも最低限のテストは書きたい

---

### 4. UIフレームワーク: なし（Vanilla）

**選択肢**:
| 選択肢 | メリット | デメリット |
|--------|---------|-----------|
| React | コンポーネント設計しやすい | バンドルサイズ増、オーバーキル |
| Preact | 軽量 | 学習コスト（Reactと微妙に違う） |
| Vanilla | 最軽量、依存なし | 複雑なUIには不向き |

**決定**: Vanilla（フレームワークなし）

**理由**:
- 表示するUIが評価とリンクのみで非常にシンプル
- バンドルサイズを最小化したい
- Shadow DOMでカプセル化すれば十分

---

### 5. 店舗検索API: Google Places API (New)

**選択肢**:
| 選択肢 | メリット | デメリット |
|--------|---------|-----------|
| Places API (New) | 最新、料金体系が明確 | 2023年リリースで情報少なめ |
| Places API (Legacy) | 情報豊富 | 将来的に非推奨の可能性 |
| スクレイピング | 無料 | 規約違反リスク、不安定 |

**決定**: Google Places API (New)

**理由**:
- 公式APIで安定性が高い
- 無料枠が個人利用には十分
- New版の方が長期サポートが期待できる

---

## 結果

以下の技術スタックを採用:

```
- 言語: TypeScript
- ビルド: Vite + CRXJS
- テスト: Vitest
- UI: Vanilla (Shadow DOM)
- API: Google Places API (New)
```

## 参考リンク

- [CRXJS Vite Plugin](https://crxjs.dev/vite-plugin)
- [Google Places API (New)](https://developers.google.com/maps/documentation/places/web-service/op-overview)
- [Chrome Extensions Manifest V3](https://developer.chrome.com/docs/extensions/develop/migrate/what-is-mv3)
