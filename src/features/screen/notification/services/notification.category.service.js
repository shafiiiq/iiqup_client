import { apiRequest } from '@/features/core/network/api/api.request';
import { readResponseBody } from '@/features/core/messaging/notification/api/notification.response';

const readMembers = async (response, fallbackMessage) => {
  const body = await readResponseBody(response, fallbackMessage);
  return body.data ?? [];
};

const buildMembersPath = (categoryKey) => `/notification/categories/${encodeURIComponent(categoryKey)}/members`;

export const fetchCategoryMembers = async (categoryKey) =>
  readMembers(await apiRequest(buildMembersPath(categoryKey)), 'Failed to load participants');

export const addCategoryMembers = async (categoryKey, uniqueCodes) =>
  readMembers(
    await apiRequest(buildMembersPath(categoryKey), 'POST', { uniqueCodes }),
    'Failed to add participants'
  );

export const removeCategoryMember = async (categoryKey, uniqueCode) =>
  readMembers(
    await apiRequest(`${buildMembersPath(categoryKey)}/${encodeURIComponent(uniqueCode)}`, 'DELETE'),
    'Failed to remove participant'
  );