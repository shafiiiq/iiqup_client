const DISMISSED_PERMISSION_PROMPT_STORAGE_KEY = 'keys.notification.dismissed_permission_prompt';

export const readDismissedPermissionPrompt = () => {
  try {
    return window.sessionStorage.getItem(DISMISSED_PERMISSION_PROMPT_STORAGE_KEY);
  } catch {
    return null;
  }
};

export const writeDismissedPermissionPrompt = (permissionState) => {
  try {
    window.sessionStorage.setItem(DISMISSED_PERMISSION_PROMPT_STORAGE_KEY, permissionState);
  } catch {
    return;
  }
};