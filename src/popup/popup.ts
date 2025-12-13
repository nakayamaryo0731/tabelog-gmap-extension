import { getApiKey, getApiKeyStatus } from '@/utils/storage';

const statusCard = document.getElementById('status-card') as HTMLElement;
const statusIcon = document.getElementById('status-icon') as HTMLElement;
const statusValue = document.getElementById('status-value') as HTMLElement;
const settingsBtn = document.getElementById('settings-btn') as HTMLButtonElement;
const linkBadge = document.getElementById('link-badge') as HTMLElement;
const ratingBadge = document.getElementById('rating-badge') as HTMLElement;
const linkModeItem = linkBadge?.parentElement as HTMLElement;
const ratingModeItem = ratingBadge?.parentElement as HTMLElement;

/**
 * 初期化
 */
async function init(): Promise<void> {
  // APIキーの状態を確認
  const apiKey = await getApiKey();
  const apiKeyStatus = await getApiKeyStatus();

  if (apiKey && apiKeyStatus.isValid) {
    // 評価表示モード
    statusCard.classList.add('active');
    statusIcon.textContent = '★';
    statusValue.textContent = '評価を表示';

    // モード表示を更新
    linkModeItem?.classList.remove('active');
    ratingModeItem?.classList.add('active');
    linkBadge.textContent = '';
    linkBadge.classList.add('inactive');
    ratingBadge.textContent = '使用中';
    ratingBadge.classList.remove('inactive');
  } else {
    // リンクのみモード
    statusCard.classList.remove('active');
    statusIcon.textContent = '🔗';
    statusValue.textContent = 'リンクのみ';

    // モード表示を更新
    linkModeItem?.classList.add('active');
    ratingModeItem?.classList.remove('active');
    linkBadge.textContent = '使用中';
    linkBadge.classList.remove('inactive');
    ratingBadge.textContent = 'APIキー必要';
    ratingBadge.classList.add('inactive');
  }

  // 設定ボタン
  settingsBtn.addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });
}

init();
