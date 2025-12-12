// レストラン情報（DOM解析結果）
export interface RestaurantInfo {
  name: string;
  address: string;
}

// Google Places API レスポンス
export interface PlaceResult {
  placeId: string;
  name: string;
  rating: number;
  userRatingsTotal: number;
  googleMapsUrl: string;
}

// Chrome Storage スキーマ
export interface StorageSchema {
  settings: Settings;
  apiKeyStatus: ApiKeyStatus;
  cache: CacheData;
}

export interface Settings {
  apiKey?: string;
  enabled: boolean;
  showReviewCount: boolean;
}

export interface ApiKeyStatus {
  isValid: boolean;
  lastChecked: number;
  errorMessage?: string;
}

export interface CacheData {
  [tabelogUrl: string]: CacheEntry;
}

export interface CacheEntry {
  placeId: string;
  rating: number;
  userRatingsTotal: number;
  googleMapsUrl: string;
  fetchedAt: number;
}

// メッセージ型（Content ↔ Background）
export type Message =
  | { type: 'SEARCH_PLACE'; payload: RestaurantInfo }
  | { type: 'VALIDATE_API_KEY'; payload: { apiKey: string } };

export type MessageResponse =
  | { success: true; data: PlaceResult }
  | { success: false; error: string }
  | { success: true; isValid: boolean; errorMessage?: string };

// UI状態
export type UIState =
  | { mode: 'loading' }
  | { mode: 'link-only'; url: string }
  | { mode: 'rating'; result: PlaceResult; url: string }
  | { mode: 'not-found'; url: string }
  | { mode: 'error'; message: string; url: string };
