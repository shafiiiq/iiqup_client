import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { setScreenNavigator } from '@/features/core/platform/navigation/screen.router';
import { initializeNotificationService } from '../bootstrap/notification.bootstrap';
import { cleanupNotificationService } from '../bootstrap/notification.cleanup';
import { useNotificationPermissionState } from '../permissions/notification.permission.state';
import { registerWebPush } from '../push/webpush.registration';

export const useNotificationBootstrap = ({ isUserLoggedIn }) => {
  const navigate = useNavigate();
  const permission = useNotificationPermissionState();

  useEffect(() => {
    setScreenNavigator(navigate);
  }, [navigate]);

  useEffect(() => {
    if (!isUserLoggedIn) return undefined;
    initializeNotificationService().catch(console.error);
    return () => cleanupNotificationService();
  }, [isUserLoggedIn]);

  useEffect(() => {
    if (isUserLoggedIn && permission === 'granted') registerWebPush().catch(console.error);
  }, [isUserLoggedIn, permission]);
};