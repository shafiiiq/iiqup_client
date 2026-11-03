import {
  readStoredRefreshToken,
  writeStoredTokens,
} from '@/features/core/device/storage/credentials/credentials.user.tokens';
import { buildApiUrl } from './api.url';

let pendingTokenRefresh = null;

const requestTokenRefresh = async () => {
  try {
    const refreshToken = readStoredRefreshToken();
    if (!refreshToken) return null;

    const response = await fetch(buildApiUrl('/authn/refresh'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    if (!response.ok) return null;

    const data = await response.json();
    if (!data.accessToken || !data.refreshToken) return null;

    writeStoredTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken });
    return data.accessToken;
  } catch {
    return null;
  }
};

export const refreshAccessToken = () => {
  if (!pendingTokenRefresh) {
    pendingTokenRefresh = requestTokenRefresh().finally(() => {
      pendingTokenRefresh = null;
    });
  }
  return pendingTokenRefresh;
};