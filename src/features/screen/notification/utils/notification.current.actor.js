import { readStoredUserData } from '@/features/core/device/storage/credentials/credentials.user.data';

export const readCurrentUserActor = () => {
  const user = readStoredUserData();
  if (!user) return null;

  const userType = (user.userType ?? '').toLowerCase();
  const model = userType === 'operator' ? 'Operator' : userType === 'mechanic' ? 'Mechanic' : 'User';

  return {
    model,
    id: user._id,
    uniqueCode: user.uniqueCode,
    name: user.name,
    designation: user.designation || '',
    profilePicPath: user.profilePic?.filePath || '',
  };
};