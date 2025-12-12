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
  container.innerHTML = renderUI(state);

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
    container.innerHTML = renderUI(state);
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
 * 状態に応じたHTMLをレンダリングする
 */
function renderUI(state: UIState): string {
  switch (state.mode) {
    case 'loading':
      return renderLoading();
    case 'link-only':
      return renderLinkOnly(state.url);
    case 'rating':
      return renderRating(state.result, state.url);
    case 'not-found':
      return renderNotFound(state.url);
    case 'error':
      return renderError(state.message, state.url);
    default:
      return '';
  }
}

/**
 * ローディング状態のHTML
 */
function renderLoading(): string {
  return `
    <span class="tgm-loading">
      <span class="tgm-spinner"></span>
      Google Map 評価を取得中...
    </span>
  `;
}

/**
 * リンクのみのHTML
 */
function renderLinkOnly(url: string): string {
  return `
    <span class="tgm-container">
      <a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer" class="tgm-link-button">
        Google Mapで見る
      </a>
    </span>
  `;
}

/**
 * 評価表示のHTML
 */
function renderRating(result: PlaceResult, url: string): string {
  const stars = '★'.repeat(Math.round(result.rating));
  const emptyStars = '☆'.repeat(5 - Math.round(result.rating));

  return `
    <span class="tgm-rating-container">
      <span class="tgm-rating">
        <span class="tgm-rating-star">${stars}${emptyStars}</span>
        <span class="tgm-rating-value">${result.rating.toFixed(1)}</span>
        <span class="tgm-rating-count">(${result.userRatingsTotal.toLocaleString()}件)</span>
      </span>
      <a href="${escapeHtml(result.googleMapsUrl || url)}" target="_blank" rel="noopener noreferrer" class="tgm-rating-link">
        Google Mapで見る
      </a>
    </span>
  `;
}

/**
 * 見つからない状態のHTML
 */
function renderNotFound(url: string): string {
  return `
    <span class="tgm-not-found">
      <span>Google Mapで該当なし</span>
      <a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer" class="tgm-rating-link">
        検索する
      </a>
    </span>
  `;
}

/**
 * エラー状態のHTML
 */
function renderError(message: string, url: string): string {
  return `
    <span class="tgm-error">
      <span>${escapeHtml(message)}</span>
      <a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer" class="tgm-rating-link">
        Google Mapで検索
      </a>
    </span>
  `;
}

/**
 * HTMLエスケープ
 */
function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
