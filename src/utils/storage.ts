import type { Settings, ApiKeyStatus, CacheData, CacheEntry } from '@/types';

// デフォルト設定
const DEFAULT_SETTINGS: Settings = {
  enabled: true,
  showReviewCount: true,
};

const DEFAULT_API_KEY_STATUS: ApiKeyStatus = {
  isValid: false,
  lastChecked: 0,
};

/**
 * 設定を取得する
 */
export async function getSettings(): Promise<Settings> {
  const result = await chrome.storage.local.get('settings');
  const stored = result.settings as Settings | undefined;
  return { ...DEFAULT_SETTINGS, ...stored };
}

/**
 * 設定を保存する
 */
export async function saveSettings(
  settings: Partial<Settings>
): Promise<void> {
  const current = await getSettings();
  await chrome.storage.local.set({
    settings: { ...current, ...settings },
  });
}

/**
 * APIキーのステータスを取得する
 */
export async function getApiKeyStatus(): Promise<ApiKeyStatus> {
  const result = await chrome.storage.local.get('apiKeyStatus');
  const stored = result.apiKeyStatus as ApiKeyStatus | undefined;
  return { ...DEFAULT_API_KEY_STATUS, ...stored };
}

/**
 * APIキーのステータスを保存する
 */
export async function saveApiKeyStatus(
  status: Partial<ApiKeyStatus>
): Promise<void> {
  const current = await getApiKeyStatus();
  await chrome.storage.local.set({
    apiKeyStatus: { ...current, ...status },
  });
}

/**
 * APIキーを取得する
 */
export async function getApiKey(): Promise<string | undefined> {
  const settings = await getSettings();
  return settings.apiKey;
}

/**
 * APIキーを保存する
 */
export async function saveApiKey(apiKey: string): Promise<void> {
  await saveSettings({ apiKey });
}

/**
 * APIキーを削除する
 */
export async function removeApiKey(): Promise<void> {
  const settings = await getSettings();
  delete settings.apiKey;
  await chrome.storage.local.set({ settings });
  await saveApiKeyStatus({
    isValid: false,
    lastChecked: 0,
    errorMessage: undefined,
  });
}

/**
 * キャッシュを取得する
 */
export async function getCache(): Promise<CacheData> {
  const result = await chrome.storage.local.get('cache');
  return (result.cache as CacheData) || ({} as CacheData);
}

/**
 * キャッシュからエントリを取得する
 */
export async function getCacheEntry(
  key: string
): Promise<CacheEntry | undefined> {
  const cache = await getCache();
  const entry = cache[key];

  // TTLチェック（7日間）
  if (entry) {
    const ttl = 7 * 24 * 60 * 60 * 1000;
    if (Date.now() - entry.fetchedAt < ttl) {
      return entry;
    }
  }

  return undefined;
}

/**
 * キャッシュにエントリを保存する
 */
export async function saveCacheEntry(
  key: string,
  entry: Omit<CacheEntry, 'fetchedAt'>
): Promise<void> {
  const cache = await getCache();

  // 最大500件制限
  const keys = Object.keys(cache);
  if (keys.length >= 500) {
    // 最も古いエントリを削除
    const oldestKey = keys.reduce((oldest, k) => {
      return cache[k].fetchedAt < cache[oldest].fetchedAt ? k : oldest;
    });
    delete cache[oldestKey];
  }

  cache[key] = {
    ...entry,
    fetchedAt: Date.now(),
  };

  await chrome.storage.local.set({ cache });
}

/**
 * キャッシュをクリアする
 */
export async function clearCache(): Promise<void> {
  await chrome.storage.local.set({ cache: {} });
}

/**
 * キャッシュの統計情報を取得する
 */
export async function getCacheStats(): Promise<{
  count: number;
  oldestEntry: number | null;
}> {
  const cache = await getCache();
  const entries = Object.values(cache);

  if (entries.length === 0) {
    return { count: 0, oldestEntry: null };
  }

  const oldestEntry = Math.min(...entries.map((e) => e.fetchedAt));
  return { count: entries.length, oldestEntry };
}
