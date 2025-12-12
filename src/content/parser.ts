import type { RestaurantInfo } from '@/types';

// 店名を取得するためのセレクタ（フォールバック対応）
const NAME_SELECTORS = ['.display-name', '.rstinfo-table__name', 'h2.display-name'];

// 住所を取得するためのセレクタ
const ADDRESS_SELECTORS = ['.rstinfo-table__address'];

/**
 * 食べログの店舗ページからレストラン情報を抽出する
 */
export function parseRestaurantPage(): RestaurantInfo | null {
  const name = extractName();
  const address = extractAddress();

  if (!name) {
    console.warn('[Tabelog x Google Map] Could not extract restaurant name');
    return null;
  }

  if (!address) {
    console.warn('[Tabelog x Google Map] Could not extract address, using name only');
  }

  return {
    name,
    address: address || '',
  };
}

/**
 * 店名を抽出する
 */
function extractName(): string | null {
  for (const selector of NAME_SELECTORS) {
    const element = document.querySelector(selector);
    if (element) {
      const text = element.textContent?.trim();
      if (text) {
        return text;
      }
    }
  }
  return null;
}

/**
 * 住所を抽出する
 * 住所はHTML構造が複雑なため、childNodesを走査してテキストを連結する
 */
function extractAddress(): string | null {
  for (const selector of ADDRESS_SELECTORS) {
    const element = document.querySelector(selector);
    if (element) {
      // 住所のテキストを収集
      const addressParts: string[] = [];
      collectTextNodes(element, addressParts);
      const address = addressParts.join('').trim();
      if (address) {
        return normalizeAddress(address);
      }
    }
  }
  return null;
}

/**
 * 要素内のテキストノードを再帰的に収集する
 */
function collectTextNodes(node: Node, parts: string[]): void {
  for (const child of node.childNodes) {
    if (child.nodeType === Node.TEXT_NODE) {
      const text = child.textContent?.trim();
      if (text) {
        parts.push(text);
      }
    } else if (child.nodeType === Node.ELEMENT_NODE) {
      // リンクや地図アイコンなど不要な要素をスキップ
      const element = child as Element;
      if (
        element.tagName === 'A' ||
        element.classList.contains('rstinfo-table__map-icon')
      ) {
        continue;
      }
      collectTextNodes(child, parts);
    }
  }
}

/**
 * 住所を正規化する（余分な空白や改行を除去）
 */
function normalizeAddress(address: string): string {
  return address
    .replace(/\s+/g, ' ')
    .replace(/　/g, ' ')
    .trim();
}

/**
 * 現在のページが店舗詳細ページかどうかを判定する
 */
export function isRestaurantDetailPage(): boolean {
  const url = window.location.href;
  // 食べログの店舗詳細ページのURLパターン: tabelog.com/{都道府県}/A{地域}/A{地域詳細}/{店舗ID}/
  const pattern = /tabelog\.com\/[^/]+\/A\d+\/A\d+\/\d+/;
  return pattern.test(url);
}
