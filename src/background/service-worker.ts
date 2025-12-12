import type { Message, MessageResponse, RestaurantInfo } from '@/types';
import { getApiKey, getCacheEntry, saveCacheEntry, getApiKeyStatus } from '@/utils/storage';
import { searchPlace, PlacesApiError } from './places-api';

console.log('[Tabelog x Google Map] Service worker started');

/**
 * メッセージハンドラ
 */
chrome.runtime.onMessage.addListener(
  (
    message: Message,
    _sender: chrome.runtime.MessageSender,
    sendResponse: (response: MessageResponse) => void
  ): boolean => {
    // 非同期処理を行うためtrueを返す
    handleMessage(message)
      .then(sendResponse)
      .catch((error) => {
        console.error('[Tabelog x Google Map] Message handler error:', error);
        sendResponse({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      });

    return true;
  }
);

/**
 * メッセージを処理する
 */
async function handleMessage(message: Message): Promise<MessageResponse> {
  switch (message.type) {
    case 'SEARCH_PLACE':
      return handleSearchPlace(message.payload);

    case 'VALIDATE_API_KEY':
      // Options Pageから直接validateApiKeyを使っているので、ここでは簡易実装
      return { success: true, isValid: true };

    default:
      return { success: false, error: 'Unknown message type' };
  }
}

/**
 * 店舗検索を処理する
 */
async function handleSearchPlace(
  info: RestaurantInfo
): Promise<MessageResponse> {
  // キャッシュキーを生成
  const cacheKey = generateCacheKey(info);

  // キャッシュを確認
  const cached = await getCacheEntry(cacheKey);
  if (cached) {
    console.log('[Tabelog x Google Map] Cache hit:', cacheKey);
    return {
      success: true,
      data: {
        placeId: cached.placeId,
        name: info.name,
        rating: cached.rating,
        userRatingsTotal: cached.userRatingsTotal,
        googleMapsUrl: cached.googleMapsUrl,
      },
    };
  }

  // APIキーを取得
  const apiKey = await getApiKey();
  if (!apiKey) {
    return { success: false, error: 'APIキーが設定されていません' };
  }

  // APIキーの有効性を確認
  const apiKeyStatus = await getApiKeyStatus();
  if (!apiKeyStatus.isValid) {
    return { success: false, error: 'APIキーが無効です。設定を確認してください' };
  }

  try {
    // Places APIで検索
    console.log('[Tabelog x Google Map] Searching place:', info.name);
    const result = await searchPlace(info, apiKey);

    if (!result) {
      return { success: false, error: '店舗が見つかりませんでした' };
    }

    // キャッシュに保存
    await saveCacheEntry(cacheKey, {
      placeId: result.placeId,
      rating: result.rating,
      userRatingsTotal: result.userRatingsTotal,
      googleMapsUrl: result.googleMapsUrl,
    });

    return { success: true, data: result };
  } catch (error) {
    if (error instanceof PlacesApiError) {
      return { success: false, error: error.getUserMessage() };
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * キャッシュキーを生成する
 */
function generateCacheKey(info: RestaurantInfo): string {
  return `${info.name}|${info.address}`.toLowerCase();
}
