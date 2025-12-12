import { parseRestaurantPage, isRestaurantDetailPage } from './parser';
import { generateGoogleMapsSearchUrl } from '@/utils/url';
import { injectUI } from './ui';
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

  // Google Maps URLを生成
  const googleMapsUrl = generateGoogleMapsSearchUrl(info.name, info.address);

  // TODO: Phase 4でAPIキーの確認を追加
  // 現在はリンクのみモードで動作
  injectUI({ mode: 'link-only', url: googleMapsUrl });
}

// DOMContentLoadedで実行
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', main);
} else {
  main();
}
