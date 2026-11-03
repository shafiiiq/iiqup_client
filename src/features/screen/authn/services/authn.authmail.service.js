import { apiRequest } from '@/features/core/network/api/api.request';

export const updateAuthnAuthMail = async ({ userId, authMail }) => {
    const response = await apiRequest('/authn/email', 'PUT', { userId, authMail, type: 'staff' });
    const data = await response.json();
    if (!data.success) throw new Error(data.message || 'Failed to update authentication email');
};