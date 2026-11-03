import { useCallback } from 'react';
import { setNotificationLike } from '../services/notification.reaction.service';

export const useNotificationReactions = ({ updateItem }) => {
  const toggleNotificationLike = useCallback(
    async (item) => {
      const nextLiked = !item.likedByMe;
      updateItem(item._id, (currentItem) => ({
        ...currentItem,
        likedByMe: nextLiked,
        likeCount: Math.max(0, currentItem.likeCount + (nextLiked ? 1 : -1)),
      }));
      try {
        const summary = await setNotificationLike(item._id, nextLiked);
        updateItem(item._id, summary);
      } catch (error) {
        console.error('toggleNotificationLike:', error);
        updateItem(item._id, { likedByMe: item.likedByMe, likeCount: item.likeCount });
      }
    },
    [updateItem]
  );

  return { toggleNotificationLike };
};