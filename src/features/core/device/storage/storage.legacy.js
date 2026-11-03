const LEGACY_AUTH_STORAGE_KEYS = ['userSession', 'user', 'accessToken', 'refreshToken', 'isUserLoggedIn'];

export const removeLegacyAuthEntries = () => {
  try {
    LEGACY_AUTH_STORAGE_KEYS.forEach((storageKey) => {
      window.localStorage.removeItem(storageKey);
      window.sessionStorage.removeItem(storageKey);
    });
  } catch {
    return;
  }
};