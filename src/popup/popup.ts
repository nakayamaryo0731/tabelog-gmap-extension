import { getApiKey, getApiKeyStatus } from '@/utils/storage';

const statusCard = document.getElementById('status-card') as HTMLElement;
const statusIcon = document.getElementById('status-icon') as HTMLElement;
const statusValue = document.getElementById('status-value') as HTMLElement;
const settingsBtn = document.getElementById('settings-btn') as HTMLButtonElement;

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
  } else {
    // リンクのみモード
    statusCard.classList.remove('active');
    statusIcon.textContent = '🔗';
    statusValue.textContent = 'リンクのみ';
  }

  // 設定ボタン
  settingsBtn.addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });
}

init();
