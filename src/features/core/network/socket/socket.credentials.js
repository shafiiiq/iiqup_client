import { readStoredUserData } from '@/features/core/device/storage/credentials/credentials.user.data';
import { readStoredSessionToken } from '@/features/core/device/storage/session/session.user';

export const readSocketCredentials = () => {
  const storedUserData = readStoredUserData();
  if (!storedUserData?.uniqueCode || !storedUserData?._id) return null;

  return {
    uniqueCode: storedUserData.uniqueCode,
    userId: storedUserData._id,
    sessionToken: readStoredSessionToken(),
  };
};