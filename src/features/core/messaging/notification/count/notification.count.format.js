import { MAX_BADGE_LABEL_COUNT } from '../constant/notification.constant';

export const formatNotificationCount = (count) =>
  count > MAX_BADGE_LABEL_COUNT ? `${MAX_BADGE_LABEL_COUNT}+` : String(count);