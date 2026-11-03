import { apiRequest } from '@/features/core/network/api/api.request';

export const verifyStaffCredentials = async ({ email, password, deviceInfo }) => {
    const response = await apiRequest('/authn/verify/user', 'POST', {
        type: 'staff',
        email: email.trim(),
        password,
        deviceInfo,
    });
    const data = await response.json();
    if (!data.success) throw new Error(data.message || 'Invalid credentials');

    return { userData: data.data, sessionToken: data.sessionToken ?? null };
};