import {
  readStoredAccessToken,
  readStoredRefreshToken,
  removeStoredTokens,
  writeStoredTokens,
} from '../credentials/credentials.user.tokens';
import {
  readStoredUserData,
  removeStoredUserData,
  writeStoredUserData,
} from '../credentials/credentials.user.data';
import { readStoredValue, removeStoredValue, writeStoredValue } from '../storage.access';
import { removeLegacyAuthEntries } from '../storage.legacy';
import { removeStoragePersistence, writeStoragePersistence } from '../storage.persistence';
import { resolveSessionExpiryTimestamp } from './session.lifetime';

const SESSION_TOKEN_STORAGE_KEY = 'session.user.token';
const SESSION_EXPIRY_STORAGE_KEY = 'session.user.expires_at';

export const readStoredSessionToken = () => readStoredValue(SESSION_TOKEN_STORAGE_KEY);

const readStoredSessionExpiry = () => {
  const rawExpiry = readStoredValue(SESSION_EXPIRY_STORAGE_KEY);
  const expiryTimestamp = Number(rawExpiry);
  return rawExpiry && Number.isFinite(expiryTimestamp) ? expiryTimestamp : null;
};

export const clearUserSession = () => {
  removeStoredUserData();
  removeStoredTokens();
  removeStoredValue(SESSION_TOKEN_STORAGE_KEY);
  removeStoredValue(SESSION_EXPIRY_STORAGE_KEY);
  removeStoragePersistence();
  removeLegacyAuthEntries();
};

export const saveUserSession = ({ userData, accessToken, refreshToken, sessionToken, isRemembered }) => {
  clearUserSession();
  writeStoragePersistence(isRemembered);
  writeStoredUserData(userData);
  writeStoredTokens({ accessToken, refreshToken });
  if (sessionToken) writeStoredValue(SESSION_TOKEN_STORAGE_KEY, sessionToken);
  writeStoredValue(SESSION_EXPIRY_STORAGE_KEY, String(resolveSessionExpiryTimestamp(isRemembered)));
};

export const hasStoredUserSession = () => {
  const expiryTimestamp = readStoredSessionExpiry();
  const hasCredentials = Boolean(readStoredAccessToken() && readStoredRefreshToken() && readStoredUserData());
  return hasCredentials && expiryTimestamp !== null && Date.now() < expiryTimestamp;
};