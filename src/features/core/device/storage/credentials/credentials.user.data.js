import { readStoredJson, removeStoredValue, writeStoredJson } from '../storage.access';

const USER_DATA_STORAGE_KEY = 'credentials.user.data';

export const readStoredUserData = () => readStoredJson(USER_DATA_STORAGE_KEY);

export const writeStoredUserData = (userData) => writeStoredJson(USER_DATA_STORAGE_KEY, userData);

export const removeStoredUserData = () => removeStoredValue(USER_DATA_STORAGE_KEY);