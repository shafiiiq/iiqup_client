const NOTIFICATION_ROUTE_PATH = '/notification';
const NOTIFICATION_ICON_PATH = '/logo192.png';

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

const listWindowClients = () => self.clients.matchAll({ type: 'window', includeUncontrolled: true });

const hasVisibleClient = (windowClients) => windowClients.some((client) => client.visibilityState === 'visible');

const readPushPayload = (event) => {
  try {
    return event.data ? event.data.json() : null;
  } catch {
    return null;
  }
};

const updateAppBadge = async (count) => {
  try {
    if (count > 0 && self.navigator.setAppBadge) await self.navigator.setAppBadge(count);
    else if (self.navigator.clearAppBadge) await self.navigator.clearAppBadge();
  } catch (error) {
    console.error('Service worker badge update failed:', error);
  }
};

self.addEventListener('push', (event) => {
  const payload = readPushPayload(event);
  if (!payload || payload.web_push) return;

  console.log('Service worker push received, totalUnread:', payload.totalUnread);

  event.waitUntil(
    (async () => {
      const windowClients = await listWindowClients();
      const badgeUpdate = updateAppBadge(Number(payload.totalUnread) || 0);
      if (hasVisibleClient(windowClients)) {
        await badgeUpdate;
        return;
      }

      await Promise.all([
        badgeUpdate,
        self.registration.showNotification(payload.title || 'New Notification', {
          body: payload.body || '',
          tag: payload.notificationId,
          icon: NOTIFICATION_ICON_PATH,
          badge: NOTIFICATION_ICON_PATH,
          data: { notificationId: payload.notificationId, primaryAction: payload.primaryAction || null },
        }),
      ]);
    })()
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const { notificationId, primaryAction } = event.notification.data || {};

  event.waitUntil(
    (async () => {
      const windowClients = await listWindowClients();
      const [existingClient] = windowClients;
      if (existingClient) {
        await existingClient.focus();
        existingClient.postMessage({ type: 'notification_click', notificationId, primaryAction });
        return;
      }
      const query = notificationId ? `?notificationId=${encodeURIComponent(notificationId)}` : '';
      await self.clients.openWindow(`${NOTIFICATION_ROUTE_PATH}${query}`);
    })()
  );
});