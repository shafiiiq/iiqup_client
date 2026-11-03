import { apiRequest } from '@/features/core/network/api/api.request';
import { applyNotificationCounts } from '@/features/core/messaging/notification/api/notification.counts.service';
import { readResponseBody } from '@/features/core/messaging/notification/api/notification.response';
import { toCursorPage } from './notification.list.service';

export const fetchReplies = async (notificationId, { after, limit, aroundReplyId }) => {
  const query = new URLSearchParams({ limit: String(limit) });
  if (after) query.set('after', after);
  if (aroundReplyId) query.set('around', aroundReplyId);
  const body = await readResponseBody(
    await apiRequest(`/notification/${notificationId}/replies?${query.toString()}`),
    'Failed to load replies'
  );
  return toCursorPage(body);
};

export const createNotificationReply = async ({
  notificationId,
  text,
  mentions,
  attachments,
  parentReplyId,
  featureLinks,
}) => {
  const body = await readResponseBody(
    await apiRequest(`/notification/${notificationId}/replies`, 'POST', {
      text,
      mentions,
      attachments,
      parentReplyId,
      featureLinks,
    }),
    'Failed to send reply'
  );
  return body.data;
};

export const markRepliesViewed = async (notificationId, replyIds) => {
  const body = await readResponseBody(
    await apiRequest(`/notification/${notificationId}/replies/viewed`, 'PUT', { replyIds }),
    'Failed to mark replies as viewed'
  );
  applyNotificationCounts({
    unread: body.data?.unread ?? 0,
    mentionsUnread: body.data?.mentionsUnread ?? 0,
    repliesUnread: body.data?.repliesUnread ?? 0,
  });
};

export const fetchReplySummary = async (notificationId) => {
  const body = await readResponseBody(
    await apiRequest(`/notification/${notificationId}/replies/summary`),
    'Failed to load reply summary'
  );
  return { total: body.data?.total ?? 0, unseen: body.data?.unseen ?? 0 };
};

export const searchMentionableActors = async (term) => {
  const body = await readResponseBody(
    await apiRequest(`/notification/mentionable?q=${encodeURIComponent(term)}`),
    'Failed to search users'
  );
  return body.data ?? [];
};

export const fetchMentionTargets = async () => {
  const body = await readResponseBody(await apiRequest('/notification/mentions'), 'Failed to load mentions');
  return body.data ?? [];
};