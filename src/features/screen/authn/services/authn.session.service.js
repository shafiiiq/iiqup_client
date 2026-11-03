import { apiRequest } from '@/features/core/network/api/api.request';
import { SessionExpiredError } from '@/features/core/network/api/api.session.expired';
import socketService from '@/features/core/network/socket/socket.service';
import { unregisterWebPush } from '@/features/core/messaging/notification/push/webpush.registration';
import {
  clearUserSession,
  hasStoredUserSession,
  saveUserSession,
} from '@/features/core/device/storage/session/session.user';

export const saveAuthnSession = ({ user, accessToken, refreshToken, sessionToken, isRemembered }) =>
  saveUserSession({ userData: user, accessToken, refreshToken, sessionToken, isRemembered });

export const verifyStoredSession = async () => {
  if (!hasStoredUserSession()) {
    clearUserSession();
    return false;
  }

  try {
    await apiRequest('/authn/verify/token');
    return true;
  } catch (error) {
    const isSessionRejected = error instanceof SessionExpiredError || typeof error?.status === 'number';
    if (isSessionRejected) clearUserSession();
    return !isSessionRejected;
  }
};

export const logoutAuthnUser = async () => {
  await unregisterWebPush();
  try {
    await apiRequest('/authn/sessions/current', 'DELETE');
  } catch {
    clearUserSession();
  }
  socketService.disconnect();
  clearUserSession();
};