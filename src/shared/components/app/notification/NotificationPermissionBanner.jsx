import { renderComponentIcon } from '@/shared/components/icons/icon.render';
import { NOTIFICATION_PERMISSION_COPY } from './notification.permission.copy';
import { useNotificationPermissionPrompt } from './useNotificationPermissionPrompt';
import './NotificationPermissionBanner.css';

const NotificationPermissionBanner = () => {
  const prompt = useNotificationPermissionPrompt();
  if (!prompt.isVisible) return null;

  const copy = NOTIFICATION_PERMISSION_COPY[prompt.permission];

  return (
    <div className="shared-widget-notification-permission-banner" role="alert">
      <span className="shared-widget-notification-permission-icon">
        {renderComponentIcon(prompt.permission === 'denied' ? 'IconlyNotificationOff' : 'IconlyNotification', 30, 'currentColor')}
      </span>
      <div className="shared-widget-notification-permission-text">
        <strong>{copy.title}</strong>
        <span>{copy.message}</span>
      </div>
      {copy.actionLabel && (
        <button
          type="button"
          className="shared-widget-notification-permission-action"
          onClick={prompt.enable}
          disabled={prompt.isEnabling}
        >
          {copy.actionLabel}
        </button>
      )}
      <button
        type="button"
        className="shared-widget-notification-permission-dismiss"
        onClick={prompt.dismiss}
        aria-label="Dismiss"
      >
        {renderComponentIcon('IconlyClose', 20, 'currentColor')}
      </button>
    </div>
  );
};

export default NotificationPermissionBanner;