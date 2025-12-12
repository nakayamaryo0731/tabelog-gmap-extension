import type { Message, MessageResponse, PlaceResult } from '@/types';
import { parseRestaurantPage, isRestaurantDetailPage } from './parser';
import { generateGoogleMapsSearchUrl } from '@/utils/url';
import { getApiKey, getApiKeyStatus } from '@/utils/storage';
import { injectUI, updateUI } from './ui';
import './styles.css';

/**
 * メイン処理
 */
async function main(): Promise<void> {
  // 店舗詳細ページでない場合は何もしない
  if (!isRestaurantDetailPage()) {
    return;
  }

  console.log('[Tabelog x Google Map] Restaurant detail page detected');

  // DOM解析
  const info = parseRestaurantPage();
  if (!info) {
    console.log('[Tabelog x Google Map] Could not parse restaurant info');
    return;
  }

  console.log('[Tabelog x Google Map] Parsed info:', info);

  // Google Maps URLを生成（フォールバック用）
  const googleMapsUrl = generateGoogleMapsSearchUrl(info.name, info.address);

  // APIキーの確認
  const apiKey = await getApiKey();
  const apiKeyStatus = await getApiKeyStatus();

  // APIキーが設定されていない、または無効な場合はリンクのみ
  if (!apiKey || !apiKeyStatus.isValid) {
    console.log('[Tabelog x Google Map] No valid API key, using link-only mode');
    injectUI({ mode: 'link-only', url: googleMapsUrl });
    return;
  }

  // APIキーがある場合は評価を取得
  console.log('[Tabelog x Google Map] API key found, fetching rating');
  injectUI({ mode: 'loading' });

  try {
    const message: Message = { type: 'SEARCH_PLACE', payload: info };
    const response = await chrome.runtime.sendMessage(message) as MessageResponse;

    if (response.success && 'data' in response) {
      const result = response.data as PlaceResult;
      console.log('[Tabelog x Google Map] Got rating:', result);
      updateUI({ mode: 'rating', result, url: googleMapsUrl });
    } else if (!response.success && 'error' in response) {
      const error = response.error;
      if (error === '店舗が見つかりませんでした') {
        updateUI({ mode: 'not-found', url: googleMapsUrl });
      } else {
        console.warn('[Tabelog x Google Map] API error:', error);
        updateUI({ mode: 'error', message: error, url: googleMapsUrl });
      }
    }
  } catch (error) {
    console.error('[Tabelog x Google Map] Error:', error);
    updateUI({
      mode: 'error',
      message: 'エラーが発生しました',
      url: googleMapsUrl,
    });
  }
}

// DOMContentLoadedで実行
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', main);
} else {
  main();
}
