import { apiRequest } from '@/features/core/network/api/api.request';
import { readResponseBody } from '@/features/core/messaging/notification/api/notification.response';

const putLike = async (path, isLiked) => {
  const body = await readResponseBody(await apiRequest(path, 'PUT', { isLiked }), 'Failed to update like');
  return body.data;
};

export const setNotificationLike = (notificationId, isLiked) =>
  putLike(`/notification/${notificationId}/like`, isLiked);

export const setReplyLike = (replyId, isLiked) => putLike(`/notification/replies/${replyId}/like`, isLiked);