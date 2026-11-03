const DEVICE_ID_STORAGE_KEY = 'keys.device.id';

export const readStoredDeviceId = () => {
  try {
    return window.localStorage.getItem(DEVICE_ID_STORAGE_KEY);
  } catch {
    return null;
  }
};

export const writeStoredDeviceId = (deviceId) => {
  try {
    window.localStorage.setItem(DEVICE_ID_STORAGE_KEY, deviceId);
  } catch {
    return;
  }
};