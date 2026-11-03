import { useCallback, useState } from 'react';
import {
  readDismissedPermissionPrompt,
  writeDismissedPermissionPrompt,
} from '@/features/core/device/storage/keys/keys.notification';
import { useNotificationPermissionState } from '@/features/core/messaging/notification/permissions/notification.permission.state';
import { enableWebPush } from '@/features/core/messaging/notification/push/webpush.registration';

const PROMPT_PERMISSION_STATES = ['default', 'denied', 'insecure'];

export const useNotificationPermissionPrompt = () => {
  const permission = useNotificationPermissionState();
  const [dismissedPermission, setDismissedPermission] = useState(readDismissedPermissionPrompt);
  const [isEnabling, setIsEnabling] = useState(false);

  const enable = useCallback(async () => {
    setIsEnabling(true);
    try {
      await enableWebPush();
    } catch (error) {
      console.error('enableWebPush:', error);
    } finally {
      setIsEnabling(false);
    }
  }, []);

  const dismiss = useCallback(() => {
    writeDismissedPermissionPrompt(permission);
    setDismissedPermission(permission);
  }, [permission]);

  const isVisible = PROMPT_PERMISSION_STATES.includes(permission) && dismissedPermission !== permission;

  return { permission, isVisible, isEnabling, enable, dismiss };
};