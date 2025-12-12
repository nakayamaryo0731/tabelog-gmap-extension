import {
  getSettings,
  saveSettings,
  getApiKeyStatus,
  saveApiKeyStatus,
  saveApiKey,
  removeApiKey,
  getCacheStats,
  clearCache,
} from '@/utils/storage';
import { validateApiKey } from '@/utils/api-key';

// DOM要素
const modeInputs = document.querySelectorAll<HTMLInputElement>(
  'input[name="mode"]'
);
const apiKeySection = document.getElementById(
  'api-key-section'
) as HTMLElement;
const apiKeyInput = document.getElementById(
  'api-key-input'
) as HTMLInputElement;
const toggleVisibilityBtn = document.getElementById(
  'toggle-visibility'
) as HTMLButtonElement;
const validateBtn = document.getElementById(
  'validate-btn'
) as HTMLButtonElement;
const saveBtn = document.getElementById('save-btn') as HTMLButtonElement;
const removeBtn = document.getElementById('remove-btn') as HTMLButtonElement;
const statusEl = document.getElementById('api-key-status') as HTMLElement;
const guideToggle = document.getElementById(
  'guide-toggle'
) as HTMLButtonElement;
const guideContent = document.getElementById('guide-content') as HTMLElement;
const cacheCountEl = document.getElementById('cache-count') as HTMLElement;
const clearCacheBtn = document.getElementById(
  'clear-cache-btn'
) as HTMLButtonElement;

// 検証結果を一時保存
let lastValidationResult: { isValid: boolean; apiKey: string } | null = null;

/**
 * 初期化
 */
async function init(): Promise<void> {
  // 設定を読み込み
  const settings = await getSettings();
  const apiKeyStatus = await getApiKeyStatus();

  // モード選択を設定
  const mode = settings.apiKey && apiKeyStatus.isValid ? 'rating' : 'link-only';
  const modeInput = document.querySelector<HTMLInputElement>(
    `input[name="mode"][value="${mode}"]`
  );
  if (modeInput) {
    modeInput.checked = true;
  }

  // APIキーセクションの表示/非表示
  updateApiKeySectionVisibility(mode);

  // APIキーが保存されている場合
  if (settings.apiKey) {
    apiKeyInput.value = '••••••••••••••••••••';
    apiKeyInput.dataset.masked = 'true';
    removeBtn.disabled = false;

    // ステータス表示
    if (apiKeyStatus.isValid) {
      showStatus('success', '✓ APIキーは有効です');
    } else if (apiKeyStatus.errorMessage) {
      showStatus('error', apiKeyStatus.errorMessage);
    }
  }

  // キャッシュ統計を表示
  await updateCacheStats();

  // イベントリスナーを設定
  setupEventListeners();
}

/**
 * イベントリスナーの設定
 */
function setupEventListeners(): void {
  // モード切り替え
  modeInputs.forEach((input) => {
    input.addEventListener('change', () => {
      updateApiKeySectionVisibility(input.value);
    });
  });

  // パスワード表示切り替え
  toggleVisibilityBtn.addEventListener('click', () => {
    if (apiKeyInput.type === 'password') {
      apiKeyInput.type = 'text';
      toggleVisibilityBtn.textContent = '🔒';
    } else {
      apiKeyInput.type = 'password';
      toggleVisibilityBtn.textContent = '👁';
    }
  });

  // 入力時にマスクをクリア
  apiKeyInput.addEventListener('focus', () => {
    if (apiKeyInput.dataset.masked === 'true') {
      apiKeyInput.value = '';
      apiKeyInput.dataset.masked = 'false';
    }
  });

  // 検証ボタン
  validateBtn.addEventListener('click', handleValidate);

  // 保存ボタン
  saveBtn.addEventListener('click', handleSave);

  // 削除ボタン
  removeBtn.addEventListener('click', handleRemove);

  // ガイド折りたたみ
  guideToggle.addEventListener('click', () => {
    guideToggle.classList.toggle('collapsed');
    guideContent.classList.toggle('collapsed');
  });

  // キャッシュクリア
  clearCacheBtn.addEventListener('click', handleClearCache);
}

/**
 * APIキーセクションの表示/非表示を切り替え
 */
function updateApiKeySectionVisibility(mode: string): void {
  if (mode === 'rating') {
    apiKeySection.style.display = 'block';
  } else {
    apiKeySection.style.display = 'none';
  }
}

/**
 * 検証ボタンのハンドラ
 */
async function handleValidate(): Promise<void> {
  const apiKey = apiKeyInput.value.trim();

  if (!apiKey || apiKeyInput.dataset.masked === 'true') {
    showStatus('error', 'APIキーを入力してください');
    return;
  }

  validateBtn.disabled = true;
  validateBtn.textContent = '検証中...';
  showStatus('info', '検証中...');

  try {
    const result = await validateApiKey(apiKey);

    if (result.isValid) {
      showStatus('success', '✓ APIキーは有効です');
      lastValidationResult = { isValid: true, apiKey };
      saveBtn.disabled = false;
    } else {
      showStatus('error', result.errorMessage || 'APIキーが無効です');
      lastValidationResult = null;
      saveBtn.disabled = true;
    }
  } catch (error) {
    showStatus('error', 'エラーが発生しました');
    lastValidationResult = null;
    saveBtn.disabled = true;
  } finally {
    validateBtn.disabled = false;
    validateBtn.textContent = '検証';
  }
}

/**
 * 保存ボタンのハンドラ
 */
async function handleSave(): Promise<void> {
  if (!lastValidationResult?.isValid) {
    showStatus('error', '先にAPIキーを検証してください');
    return;
  }

  try {
    await saveApiKey(lastValidationResult.apiKey);
    await saveApiKeyStatus({
      isValid: true,
      lastChecked: Date.now(),
    });
    await saveSettings({ apiKey: lastValidationResult.apiKey });

    showStatus('success', '✓ 保存しました');
    apiKeyInput.value = '••••••••••••••••••••';
    apiKeyInput.dataset.masked = 'true';
    removeBtn.disabled = false;
    saveBtn.disabled = true;
    lastValidationResult = null;
  } catch (error) {
    showStatus('error', '保存に失敗しました');
  }
}

/**
 * 削除ボタンのハンドラ
 */
async function handleRemove(): Promise<void> {
  if (!confirm('APIキーを削除しますか？')) {
    return;
  }

  try {
    await removeApiKey();
    apiKeyInput.value = '';
    apiKeyInput.dataset.masked = 'false';
    removeBtn.disabled = true;
    saveBtn.disabled = true;
    lastValidationResult = null;
    showStatus('info', 'APIキーを削除しました');

    // モードをリンクのみに戻す
    const linkOnlyInput = document.querySelector<HTMLInputElement>(
      'input[name="mode"][value="link-only"]'
    );
    if (linkOnlyInput) {
      linkOnlyInput.checked = true;
      updateApiKeySectionVisibility('link-only');
    }
  } catch (error) {
    showStatus('error', '削除に失敗しました');
  }
}

/**
 * キャッシュクリアのハンドラ
 */
async function handleClearCache(): Promise<void> {
  try {
    await clearCache();
    await updateCacheStats();
    alert('キャッシュをクリアしました');
  } catch (error) {
    alert('キャッシュのクリアに失敗しました');
  }
}

/**
 * キャッシュ統計を更新
 */
async function updateCacheStats(): Promise<void> {
  const stats = await getCacheStats();
  cacheCountEl.textContent = stats.count.toString();
}

/**
 * ステータスメッセージを表示
 */
function showStatus(
  type: 'success' | 'error' | 'info',
  message: string
): void {
  statusEl.className = `status show ${type}`;
  statusEl.textContent = message;
}

// 初期化
init();
