import { apiRequest } from '@/features/core/network/api/api.request';
import { readResponseBody } from '@/features/core/messaging/notification/api/notification.response';

export const fetchDistributions = async () => {
  const body = await readResponseBody(await apiRequest('/notification/distributions'), 'Failed to load features');
  return body.data ?? [];
};

export const fetchCategorySuggestions = async (query) => {
  const body = await readResponseBody(
    await apiRequest(`/notification/categories?q=${encodeURIComponent(query)}`),
    'Failed to load categories'
  );
  return body.data ?? [];
};

export const sendComposedMessage = async (payload) => {
  await readResponseBody(await apiRequest('/notification/compose', 'POST', payload), 'Failed to send message');
};

export const fetchAttachmentFeatures = async () => {
  const body = await readResponseBody(
    await apiRequest('/notification/attachment-features'),
    'Failed to load documents'
  );
  return body.data ?? [];
};

export const fetchFeatureDocuments = async (featureKey, term) => {
  const body = await readResponseBody(
    await apiRequest(
      `/notification/attachment-features/${encodeURIComponent(featureKey)}/documents?q=${encodeURIComponent(term)}`
    ),
    'Failed to load documents'
  );
  return body.data ?? [];
};

export const fetchFieldSuggestions = async (distributionKey, fieldKey, term) => {
  const body = await readResponseBody(
    await apiRequest(
      `/notification/distributions/${encodeURIComponent(distributionKey)}/fields/${encodeURIComponent(fieldKey)}/suggestions?q=${encodeURIComponent(term)}`
    ),
    'Failed to load suggestions'
  );
  return body.data ?? [];
};

export const submitDistribution = async (distributionKey, payload, notificationId) => {
  await readResponseBody(
    await apiRequest(`/notification/distributions/${encodeURIComponent(distributionKey)}/submit`, 'POST', {
      ...payload,
      ...(notificationId ? { notificationId } : {}),
    }),
    'Failed to submit'
  );
};