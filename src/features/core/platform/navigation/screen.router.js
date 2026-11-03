import { NOTIFICATION_ROUTE_PATH } from '@/features/core/messaging/notification/constant/notification.constant';
import { WEB_SCREEN_ROUTE_BUILDERS } from './screen.route.map';

let navigateFunction = null;

export const setScreenNavigator = (navigate) => {
  navigateFunction = navigate;
};

export const navigateToScreen = ({ screenKey, documentId }) => {
  const buildRoute = WEB_SCREEN_ROUTE_BUILDERS[screenKey];
  if (!buildRoute || !navigateFunction) return false;
  navigateFunction(buildRoute(documentId));
  return true;
};

export const openNotificationsTab = (notificationId) => {
  const query = notificationId ? `?notificationId=${encodeURIComponent(notificationId)}` : '';
  navigateFunction?.(`${NOTIFICATION_ROUTE_PATH}${query}`);
};