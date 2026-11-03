import { apiRequest } from '@/features/core/network/api/api.request';
import { getStoredDeviceToken } from '../helper/signature.device.storage';
import { SIGNATURE_DEVICE_TOKEN_HEADER } from '../constants/signature.constant';

const buildDeviceHeaders = async () => {
    const deviceToken = await getStoredDeviceToken();
    return deviceToken ? { [SIGNATURE_DEVICE_TOKEN_HEADER]: deviceToken } : {};
};

export const fetchMySignatureStatus = async () =>
    apiRequest('/signature/me/status', 'GET', null, await buildDeviceHeaders());

export const requestSignatureActivation = async ({ kind, activationCode, publicKey, timezone }) =>
    apiRequest('/signature/activation-requests', 'POST', { kind, platform: 'web', activationCode, publicKey, timezone });

export const pollSignatureActivation = async (requestId, pollSecret) =>
    apiRequest(`/signature/activation-requests/${encodeURIComponent(requestId)}/poll`, 'POST', { pollSecret });

export const cancelSignatureActivation = async (requestId, pollSecret) =>
    apiRequest(`/signature/activation-requests/${encodeURIComponent(requestId)}/cancel`, 'POST', { pollSecret });

export const requestSignatureChallenge = async () =>
    apiRequest('/signature/challenge', 'POST', null, await buildDeviceHeaders());

export const fetchDocumentSignatures = async (sourceKey, documentId) =>
    apiRequest(`/signature/sources/${encodeURIComponent(sourceKey)}/documents/${encodeURIComponent(documentId)}`, 'GET');

export const fetchSignatureImage = async (eventId) =>
    apiRequest(`/signature/events/${encodeURIComponent(eventId)}/image`, 'GET');

export const submitSignature = async ({ sourceKey, documentId, slotId, override, challengeId, proof }) =>
    apiRequest(
        '/signature/sign',
        'POST',
        { sourceKey, documentId, slotId, override, challengeId, proof },
        await buildDeviceHeaders()
    );