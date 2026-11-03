import { apiRequest } from '@/features/core/network/api/api.request';
import { readResponseBody } from '@/features/core/messaging/notification/api/notification.response';

const loadSummary = async (groupBy) => {
  const body = await readResponseBody(
    await apiRequest(`/notification/summary?groupBy=${groupBy}`),
    'Failed to load summary'
  );
  return body.data ?? [];
};

export const fetchCategorySummaries = () => loadSummary('category');

export const fetchPersonSummaries = () => loadSummary('person');