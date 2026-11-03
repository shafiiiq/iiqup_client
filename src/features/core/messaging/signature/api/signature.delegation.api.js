import { apiRequest } from '@/features/core/network/api/api.request';

export const requestSignatureDelegation = async ({ sourceKey, documentId, slotId }) =>
    apiRequest('/signature/delegations/requests', 'POST', { sourceKey, documentId, slotId });

export const fetchGivenSignatureDelegations = async () => apiRequest('/signature/me/delegations/given', 'GET');

export const revokeSignatureDelegation = async (delegationId) =>
    apiRequest(`/signature/me/delegations/${encodeURIComponent(delegationId)}/revoke`, 'POST');