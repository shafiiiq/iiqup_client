import { useSyncExternalStore } from 'react';
import { readNotificationPermission, subscribeToNotificationPermissionChange } from './notification.permissions';

export const useNotificationPermissionState = () =>
  useSyncExternalStore(subscribeToNotificationPermissionChange, readNotificationPermission);