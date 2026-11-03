import { apiRequest } from '@/features/core/network/api/api.request';
import { readResponseBody } from '@/features/core/messaging/notification/api/notification.response';
import { readStoredUserData } from '@/features/core/device/storage/credentials/credentials.user.data';

const NOTIFICATION_PAGE_SIZE = 20;
const SEARCH_PAGE_SIZE = 50;

export const toCursorPage = (body) => ({
  items: body.data ?? [],
  nextCursor: body.pagination?.nextCursor ?? null,
  hasMore: Boolean(body.pagination?.hasMore),
});

export const fetchNotificationPage = async ({ tab, before }) => {
  const query = new URLSearchParams({ tab: tab.tab, limit: String(NOTIFICATION_PAGE_SIZE) });
  if (tab.categoryKey) query.set('categoryKey', tab.categoryKey);
  if (before) query.set('before', before);
  const body = await readResponseBody(
    await apiRequest(`/notification?${query.toString()}`),
    'Failed to load notifications'
  );
  return toCursorPage(body);
};

export const fetchNotificationTabs = async () => {
  const body = await readResponseBody(await apiRequest('/notification/tabs'), 'Failed to load tabs');
  return body.data ?? [];
};

export const searchNotifications = async (term) => {
  const uniqueCode = readStoredUserData()?.uniqueCode ?? '';
  const body = await readResponseBody(
    await apiRequest('/search', 'POST', { q: term, source: 'notifications', page: 1, limit: SEARCH_PAGE_SIZE }),
    'Search failed'
  );
  const rawItems = body.results?.notifications?.data ?? [];
  return rawItems.map((raw) => ({
    _id: String(raw._id),
    kind: raw.kind,
    title: raw.title,
    body: raw.body ?? '',
    priority: raw.priority,
    actor: raw.actor ?? null,
    source: raw.source ?? null,
    actions: raw.actions ?? [],
    mentions: raw.mentions ?? [],
    likeCount: (raw.likes ?? []).length,
    likedByMe: (raw.likes ?? []).some((like) => like.uniqueCode === uniqueCode),
    replyCount: raw.replyCount ?? 0,
    isRead:
      !(raw.recipients ?? []).includes(uniqueCode) ||
      (raw.readBy ?? []).some((receipt) => receipt.uniqueCode === uniqueCode),
    mentionsMe: (raw.mentions ?? []).includes(uniqueCode),
    createdAt: raw.createdAt,
    lastActivityAt: raw.lastActivityAt ?? raw.createdAt,
    unseenReplyCount: 0,
    categoryKey: raw.categoryKey ?? null,
    categoryLabel: null,
    featureLinks: raw.featureLinks ?? [],
    sourceAttachments: [],
  }));
};