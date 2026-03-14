self.addEventListener('push', (event) => {
  const data = event.data?.json() || {};
  event.waitUntil(
    self.registration.showNotification(data.title || 'New Notification', {
      body:  data.description || data.message || '',
      icon:  '/logo192.png',
      badge: '/logo192.png',
      data:  data,
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes('/notification') && 'focus' in client) return client.focus();
      }
      return clients.openWindow('/notification');
    })
  );
});