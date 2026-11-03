import { readStoredUserData } from '@/features/core/device/storage/credentials/credentials.user.data';
import { hasStoredUserSession } from '@/features/core/device/storage/session/session.user';

export const readCurrentUser = () => (hasStoredUserSession() ? readStoredUserData() : null);