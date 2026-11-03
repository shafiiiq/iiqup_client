import { resolveSessionStorageArea } from './storage.persistence';

export const readStoredValue = (storageKey) => {
  try {
    return resolveSessionStorageArea().getItem(storageKey);
  } catch {
    return null;
  }
};

export const writeStoredValue = (storageKey, value) => {
  try {
    resolveSessionStorageArea().setItem(storageKey, value);
    return true;
  } catch {
    return false;
  }
};

export const removeStoredValue = (storageKey) => {
  try {
    window.localStorage.removeItem(storageKey);
    window.sessionStorage.removeItem(storageKey);
  } catch {
    return;
  }
};

export const readStoredJson = (storageKey) => {
  const rawValue = readStoredValue(storageKey);
  if (!rawValue) return null;
  try {
    return JSON.parse(rawValue);
  } catch {
    return null;
  }
};

export const writeStoredJson = (storageKey, value) => writeStoredValue(storageKey, JSON.stringify(value));