import { readStoredValue, removeStoredValue, writeStoredValue } from '../storage.access';

const ACCESS_TOKEN_STORAGE_KEY = 'credentials.user.access_token';
const REFRESH_TOKEN_STORAGE_KEY = 'credentials.user.refresh_token';

export const readStoredAccessToken = () => readStoredValue(ACCESS_TOKEN_STORAGE_KEY);

export const readStoredRefreshToken = () => readStoredValue(REFRESH_TOKEN_STORAGE_KEY);

export const writeStoredTokens = ({ accessToken, refreshToken }) => {
  writeStoredValue(ACCESS_TOKEN_STORAGE_KEY, accessToken);
  writeStoredValue(REFRESH_TOKEN_STORAGE_KEY, refreshToken);
};

export const removeStoredTokens = () => {
  removeStoredValue(ACCESS_TOKEN_STORAGE_KEY);
  removeStoredValue(REFRESH_TOKEN_STORAGE_KEY);
};