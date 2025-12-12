import type { RestaurantInfo, PlaceResult } from '@/types';

const PLACES_API_URL = 'https://places.googleapis.com/v1/places:searchText';

/**
 * Places APIでレストランを検索する
 */
export async function searchPlace(
  info: RestaurantInfo,
  apiKey: string
): Promise<PlaceResult | null> {
  const query = info.address
    ? `${info.name} ${info.address}`
    : info.name;

  const response = await fetch(PLACES_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask':
        'places.id,places.displayName,places.rating,places.userRatingCount,places.googleMapsUri',
    },
    body: JSON.stringify({
      textQuery: query,
      maxResultCount: 1,
      languageCode: 'ja',
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new PlacesApiError(
      response.status,
      error?.error?.message || `API error: ${response.status}`
    );
  }

  const data = await response.json();
  const place = data.places?.[0];

  if (!place) {
    return null;
  }

  return {
    placeId: place.id,
    name: place.displayName?.text || '',
    rating: place.rating || 0,
    userRatingsTotal: place.userRatingCount || 0,
    googleMapsUrl: place.googleMapsUri || '',
  };
}

/**
 * Places APIエラー
 */
export class PlacesApiError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
    this.name = 'PlacesApiError';
  }

  /**
   * ユーザー向けメッセージを取得
   */
  getUserMessage(): string {
    switch (this.status) {
      case 400:
        return 'リクエストが不正です';
      case 401:
      case 403:
        return 'APIキーが無効です';
      case 429:
        return 'API制限を超えました';
      default:
        return 'エラーが発生しました';
    }
  }
}
