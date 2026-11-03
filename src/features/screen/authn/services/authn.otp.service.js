import { apiRequest } from '@/features/core/network/api/api.request';

export const requestAuthnOtp = async (authMail) => {
    const response = await apiRequest('/otp/request', 'POST', { email: authMail });
    const data = await response.json();
    if (!data.success) throw new Error(data.message || 'Failed to send OTP');
};

export const verifyAuthnOtp = async ({ authMail, otp, userData, deviceInfo }) => {
    const response = await apiRequest('/otp/verify', 'POST', {
        email: authMail,
        authMail,
        otp,
        userId: userData._id,
        userType: userData.userType || 'staff',
        deviceInfo,
    });
    const data = await response.json();
    if (!data.success || !data.authorized || !data.data?.user) {
        throw new Error(data.message || 'Invalid OTP');
    }

    return {
        user: data.data.user,
        accessToken: data.data.accessToken,
        refreshToken: data.data.refreshToken,
        sessionToken: data.data.sessionToken ?? null,
    };
};