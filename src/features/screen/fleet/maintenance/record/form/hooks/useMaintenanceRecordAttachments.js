import { useEffect, useRef, useCallback } from 'react';
import { uploadFile } from '@/features/core/sync/upload/upload.service';
import { MAINTENANCE_UPLOAD_FEATURE, MAINTENANCE_UPLOAD_KEY_PREFIX } from '../../../constants/maintenance.constant';
import { isSupportedMediaFile, buildPendingAttachment } from '../../../form/helper/maintenance.form.helper';

export const useMaintenanceRecordAttachments = ({ cards, setCards }) => {
  const latestCardsRef = useRef(cards);

  useEffect(() => {
    latestCardsRef.current = cards;
  }, [cards]);

  const releasePreviews = useCallback((cardsToRelease) => {
    cardsToRelease.forEach((card) => {
      card.attachments.forEach((attachment) => {
        if (attachment.previewUrl) URL.revokeObjectURL(attachment.previewUrl);
      });
    });
  }, []);

  useEffect(() => () => releasePreviews(latestCardsRef.current), [releasePreviews]);

  const updateAttachment = useCallback(
    (cardId, localId, changes) => {
      setCards((previous) =>
        previous.map((card) =>
          card.id === cardId
            ? {
                ...card,
                attachments: card.attachments.map((attachment) =>
                  attachment.localId === localId ? { ...attachment, ...changes } : attachment
                ),
              }
            : card
        )
      );
    },
    [setCards]
  );

  const uploadAttachment = useCallback(
    async (cardId, localId, file) => {
      try {
        const { sessionId, s3Key } = await uploadFile({
          file,
          feature: MAINTENANCE_UPLOAD_FEATURE,
          keyPrefix: MAINTENANCE_UPLOAD_KEY_PREFIX,
          onProgress: (progress) => updateAttachment(cardId, localId, { progress }),
        });
        updateAttachment(cardId, localId, { sessionId, s3Key, status: 'done', progress: 100 });
      } catch (error) {
        updateAttachment(cardId, localId, { status: 'error', errorMessage: error.message });
      }
    },
    [updateAttachment]
  );

  const addFiles = useCallback(
    (cardId, files) => {
      const pendingUploads = files.filter(isSupportedMediaFile).map((file) => ({
        file,
        attachment: buildPendingAttachment(file),
      }));
      if (pendingUploads.length === 0) return;

      setCards((previous) =>
        previous.map((card) =>
          card.id === cardId
            ? { ...card, attachments: [...card.attachments, ...pendingUploads.map(({ attachment }) => attachment)] }
            : card
        )
      );
      pendingUploads.forEach(({ file, attachment }) => uploadAttachment(cardId, attachment.localId, file));
    },
    [setCards, uploadAttachment]
  );

  const removeAttachment = useCallback(
    (cardId, localId) => {
      setCards((previous) =>
        previous.map((card) => {
          if (card.id !== cardId) return card;
          const removedAttachment = card.attachments.find((attachment) => attachment.localId === localId);
          if (removedAttachment?.previewUrl) URL.revokeObjectURL(removedAttachment.previewUrl);
          return { ...card, attachments: card.attachments.filter((attachment) => attachment.localId !== localId) };
        })
      );
    },
    [setCards]
  );

  return { addFiles, removeAttachment, releasePreviews };
};