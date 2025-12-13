import type { UIState, PlaceResult } from '@/types';

// UIを挿入する先のセレクタ
const INSERTION_SELECTORS = [
  '.rdheader-rstname',
  '.js-header-rating',
  '.rstinfo-table__name-wrap',
];

// UIコンテナのID
const CONTAINER_ID = 'tgm-extension-container';

/**
 * UIを挿入する
 */
export function injectUI(state: UIState): void {
  // 既存のUIがあれば削除
  removeUI();

  const container = document.createElement('span');
  container.id = CONTAINER_ID;
  renderUI(state, container);

  // 挿入先を探す
  const insertionPoint = findInsertionPoint();
  if (insertionPoint) {
    insertionPoint.appendChild(container);
  } else {
    console.warn('[Tabelog x Google Map] Could not find insertion point');
  }
}

/**
 * UIを更新する
 */
export function updateUI(state: UIState): void {
  const container = document.getElementById(CONTAINER_ID);
  if (container) {
    // 既存の子要素をクリア
    container.textContent = '';
    renderUI(state, container);
  } else {
    injectUI(state);
  }
}

/**
 * UIを削除する
 */
export function removeUI(): void {
  const existing = document.getElementById(CONTAINER_ID);
  if (existing) {
    existing.remove();
  }
}

/**
 * UIの挿入先を探す
 */
function findInsertionPoint(): Element | null {
  for (const selector of INSERTION_SELECTORS) {
    const element = document.querySelector(selector);
    if (element) {
      return element;
    }
  }
  return null;
}

/**
 * 状態に応じたUIをDOM APIでレンダリングする
 */
function renderUI(state: UIState, container: HTMLElement): void {
  switch (state.mode) {
    case 'loading':
      renderLoading(container);
      break;
    case 'link-only':
      renderLinkOnly(state.url, container);
      break;
    case 'rating':
      renderRating(state.result, state.url, container);
      break;
    case 'not-found':
      renderNotFound(state.url, container);
      break;
    case 'error':
      renderError(state.message, state.url, container);
      break;
  }
}

/**
 * ローディング状態のUI
 */
function renderLoading(container: HTMLElement): void {
  const span = document.createElement('span');
  span.className = 'tgm-loading';

  const spinner = document.createElement('span');
  spinner.className = 'tgm-spinner';
  span.appendChild(spinner);

  span.appendChild(document.createTextNode('Google Map 評価を取得中...'));
  container.appendChild(span);
}

/**
 * リンクのみのUI
 */
function renderLinkOnly(url: string, container: HTMLElement): void {
  const span = document.createElement('span');
  span.className = 'tgm-container';

  const link = createSafeLink(url, 'Google Mapで見る', 'tgm-link-button');
  span.appendChild(link);

  container.appendChild(span);
}

/**
 * 評価表示のUI
 */
function renderRating(result: PlaceResult, url: string, container: HTMLElement): void {
  const ratingContainer = document.createElement('span');
  ratingContainer.className = 'tgm-rating-container';

  // 評価部分
  const ratingSpan = document.createElement('span');
  ratingSpan.className = 'tgm-rating';

  // 星
  const starSpan = document.createElement('span');
  starSpan.className = 'tgm-rating-star';
  const stars = '★'.repeat(Math.round(result.rating));
  const emptyStars = '☆'.repeat(5 - Math.round(result.rating));
  starSpan.textContent = stars + emptyStars;
  ratingSpan.appendChild(starSpan);

  // 評価値
  const valueSpan = document.createElement('span');
  valueSpan.className = 'tgm-rating-value';
  valueSpan.textContent = result.rating.toFixed(1);
  ratingSpan.appendChild(valueSpan);

  // レビュー数
  const countSpan = document.createElement('span');
  countSpan.className = 'tgm-rating-count';
  countSpan.textContent = `(${result.userRatingsTotal.toLocaleString()}件)`;
  ratingSpan.appendChild(countSpan);

  ratingContainer.appendChild(ratingSpan);

  // リンク
  const linkUrl = result.googleMapsUrl || url;
  const link = createSafeLink(linkUrl, 'Google Mapで見る', 'tgm-rating-link');
  ratingContainer.appendChild(link);

  container.appendChild(ratingContainer);
}

/**
 * 見つからない状態のUI
 */
function renderNotFound(url: string, container: HTMLElement): void {
  const span = document.createElement('span');
  span.className = 'tgm-not-found';

  const textSpan = document.createElement('span');
  textSpan.textContent = 'Google Mapで該当なし';
  span.appendChild(textSpan);

  const link = createSafeLink(url, '検索する', 'tgm-rating-link');
  span.appendChild(link);

  container.appendChild(span);
}

/**
 * エラー状態のUI
 */
function renderError(message: string, url: string, container: HTMLElement): void {
  const span = document.createElement('span');
  span.className = 'tgm-error';

  const textSpan = document.createElement('span');
  textSpan.textContent = message; // textContentなのでXSS安全
  span.appendChild(textSpan);

  const link = createSafeLink(url, 'Google Mapで検索', 'tgm-rating-link');
  span.appendChild(link);

  container.appendChild(span);
}

/**
 * 安全なリンク要素を作成する
 * - URLはhttp/httpsのみ許可（javascript:等を防止）
 * - target="_blank"にrel="noopener noreferrer"を付与
 */
function createSafeLink(url: string, text: string, className: string): HTMLAnchorElement {
  const link = document.createElement('a');

  // URLの検証（http/httpsのみ許可）
  if (isValidUrl(url)) {
    link.href = url;
  } else {
    // 無効なURLの場合はGoogle検索にフォールバック
    link.href = 'https://www.google.com/maps';
    console.warn('[Tabelog x Google Map] Invalid URL blocked:', url);
  }

  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  link.className = className;
  link.textContent = text; // textContentなのでXSS安全

  return link;
}

/**
 * URLが有効（http/https）かどうかを検証する
 */
function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}
