const ONBOARD_SEEN_STORAGE_KEY = 'hasSeenOnboard';

export const readOnboardSeen = () => {
  try {
    return window.localStorage.getItem(ONBOARD_SEEN_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
};

export const writeOnboardSeen = () => {
  try {
    window.localStorage.setItem(ONBOARD_SEEN_STORAGE_KEY, 'true');
  } catch {
    return;
  }
};