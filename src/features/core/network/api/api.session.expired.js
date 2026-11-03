import { clearUserSession } from '@/features/core/device/storage/session/session.user';
import { resetNotificationCounts } from '@/features/core/messaging/notification/count/notification.count.reset';
import { terminateSocket } from '@/features/core/network/socket/socket.teardown';
import { AUTHN_ROUTES } from '@/features/screen/authn/constants/authn.routes';

export const SESSION_EXPIRED_MESSAGE = 'Session expired - redirecting to authn';

export class SessionExpiredError extends Error {
  constructor() {
    super(SESSION_EXPIRED_MESSAGE);
    this.name = 'SessionExpiredError';
  }
}

const isPdfRenderPage = () => new URLSearchParams(window.location.search).get('pdf') === '1';

export const expireSession = () => {
  if (isPdfRenderPage()) return;
  terminateSocket();
  resetNotificationCounts();
  clearUserSession();
  if (window.location.pathname !== AUTHN_ROUTES.AUTHN) window.location.replace(AUTHN_ROUTES.AUTHN);
};