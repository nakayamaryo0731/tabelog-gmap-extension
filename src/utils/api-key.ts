export interface ValidationResult {
  isValid: boolean;
  errorMessage?: string;
}

/**
 * APIキーを検証する（テストリクエストを送信）
 */
export async function validateApiKey(apiKey: string): Promise<ValidationResult> {
  if (!apiKey || apiKey.trim() === '') {
    return {
      isValid: false,
      errorMessage: 'APIキーを入力してください',
    };
  }

  try {
    // 東京駅で検索テスト
    const response = await fetch(
      'https://places.googleapis.com/v1/places:searchText',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': apiKey.trim(),
          'X-Goog-FieldMask': 'places.displayName',
        },
        body: JSON.stringify({
          textQuery: '東京駅',
          maxResultCount: 1,
        }),
      }
    );

    if (response.ok) {
      return { isValid: true };
    }

    // エラーレスポンスを解析
    const errorData = await response.json().catch(() => null);
    return {
      isValid: false,
      errorMessage: mapApiErrorToMessage(response.status, errorData),
    };
  } catch (error) {
    console.error('[Tabelog x Google Map] API key validation error:', error);
    return {
      isValid: false,
      errorMessage: 'ネットワークエラーが発生しました',
    };
  }
}

/**
 * APIエラーをユーザー向けメッセージに変換する
 */
function mapApiErrorToMessage(
  status: number,
  errorData: { error?: { message?: string } } | null
): string {
  switch (status) {
    case 400:
      return 'リクエストが不正です。APIキーを確認してください';
    case 401:
    case 403:
      return 'APIキーが無効か、Places APIが有効になっていません';
    case 429:
      return 'APIの利用制限を超えました。しばらくお待ちください';
    default:
      if (errorData?.error?.message) {
        return errorData.error.message;
      }
      return `エラーが発生しました (${status})`;
  }
}
