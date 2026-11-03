const STORAGE_PERSISTENCE_KEY = 'keys.session.persistence';
const PERSISTENT_VALUE = 'persistent';
const TAB_ONLY_VALUE = 'tab_only';

export const writeStoragePersistence = (isPersistent) => {
  try {
    window.localStorage.setItem(STORAGE_PERSISTENCE_KEY, isPersistent ? PERSISTENT_VALUE : TAB_ONLY_VALUE);
  } catch {
    return;
  }
};

export const removeStoragePersistence = () => {
  try {
    window.localStorage.removeItem(STORAGE_PERSISTENCE_KEY);
  } catch {
    return;
  }
};

export const resolveSessionStorageArea = () => {
  try {
    const isPersistent = window.localStorage.getItem(STORAGE_PERSISTENCE_KEY) === PERSISTENT_VALUE;
    return isPersistent ? window.localStorage : window.sessionStorage;
  } catch {
    return window.sessionStorage;
  }
};