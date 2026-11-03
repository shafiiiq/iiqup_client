export const NOTIFICATION_PERMISSION_COPY = {
  default: {
    title: 'Turn on notifications',
    message: 'Get new messages and mentions on this device, even when the app is closed.',
    actionLabel: 'Turn on',
  },
  denied: {
    title: 'Notifications are blocked',
    message: 'Click the lock icon in the address bar, set Notifications to Allow, then press Check again.',
    actionLabel: 'Check again',
  },
  insecure: {
    title: 'Notifications need a secure connection',
    message: 'Open this app over HTTPS to receive notifications and the app icon badge.',
    actionLabel: null,
  },
};