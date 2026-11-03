export const readNotificationPermission = () => {
  if (!window.isSecureContext) return 'insecure';
  const isSupported = 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window;
  return isSupported ? Notification.permission : 'unsupported';
};

export const requestNotificationPermission = async () => {
  const currentPermission = readNotificationPermission();
  if (currentPermission !== 'default') return currentPermission;
  return Notification.requestPermission();
};

export const subscribeToNotificationPermissionChange = (listener) => {
  let permissionStatus = null;
  let isDisposed = false;

  if (navigator.permissions?.query) {
    navigator.permissions
      .query({ name: 'notifications' })
      .then((status) => {
        if (isDisposed) return;
        permissionStatus = status;
        status.addEventListener('change', listener);
      })
      .catch(() => undefined);
  }

  window.addEventListener('focus', listener);
  document.addEventListener('visibilitychange', listener);

  return () => {
    isDisposed = true;
    permissionStatus?.removeEventListener('change', listener);
    window.removeEventListener('focus', listener);
    document.removeEventListener('visibilitychange', listener);
  };
};