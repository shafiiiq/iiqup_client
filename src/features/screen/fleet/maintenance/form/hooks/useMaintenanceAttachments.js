import { useState, useRef, useEffect, useCallback } from 'react';
import { uploadFile } from '@/features/core/sync/upload/upload.service';
import { MAINTENANCE_UPLOAD_FEATURE, MAINTENANCE_UPLOAD_KEY_PREFIX } from '../../constants/maintenance.constant';
import { createLocalId } from '../helper/maintenance.form.helper';

const isSupportedMediaFile = (file) => file.type.startsWith('image/') || file.type.startsWith('video/');

export const useMaintenanceAttachments = () => {
  const [attachments, setAttachments] = useState([]);
  const latestAttachmentsRef = useRef([]);

  useEffect(() => {
    latestAttachmentsRef.current = attachments;
  }, [attachments]);

  useEffect(
    () => () => {
      latestAttachmentsRef.current.forEach((attachment) => {
        if (attachment.previewUrl) URL.revokeObjectURL(attachment.previewUrl);
      });
    },
    []
  );

  const updateAttachment = useCallback((localId, changes) => {
    setAttachments((current) =>
      current.map((attachment) => (attachment.localId === localId ? { ...attachment, ...changes } : attachment))
    );
  }, []);

  const uploadAttachment = useCallback(
    async (localId, file) => {
      try {
        const { sessionId, s3Key } = await uploadFile({
          file,
          feature: MAINTENANCE_UPLOAD_FEATURE,
          keyPrefix: MAINTENANCE_UPLOAD_KEY_PREFIX,
          onProgress: (progress) => updateAttachment(localId, { progress }),
        });
        updateAttachment(localId, { sessionId, s3Key, status: 'done', progress: 100 });
      } catch (error) {
        updateAttachment(localId, { status: 'error', errorMessage: error.message });
      }
    },
    [updateAttachment]
  );

  const addFiles = useCallback(
    (files) => {
      const pendingUploads = files.filter(isSupportedMediaFile).map((file) => ({
        file,
        attachment: {
          localId: createLocalId(),
          sessionId: '',
          s3Key: '',
          fileName: file.name,
          mimeType: file.type,
          fileSize: file.size,
          previewUrl: URL.createObjectURL(file),
          progress: 0,
          status: 'uploading',
          errorMessage: '',
        },
      }));
      if (pendingUploads.length === 0) return;

      setAttachments((current) => [...current, ...pendingUploads.map(({ attachment }) => attachment)]);
      pendingUploads.forEach(({ attachment, file }) => uploadAttachment(attachment.localId, file));
    },
    [uploadAttachment]
  );

  const removeAttachment = useCallback((localId) => {
    setAttachments((current) => {
      const removed = current.find((attachment) => attachment.localId === localId);
      if (removed?.previewUrl) URL.revokeObjectURL(removed.previewUrl);
      return current.filter((attachment) => attachment.localId !== localId);
    });
  }, []);

  const loadExistingAttachments = useCallback((existingAttachments) => {
    setAttachments(
      existingAttachments.map((attachment) => ({
        ...attachment,
        localId: attachment.sessionId,
        previewUrl: '',
        progress: 100,
        status: 'done',
        errorMessage: '',
      }))
    );
  }, []);

  return {
    attachments,
    addFiles,
    removeAttachment,
    loadExistingAttachments,
    hasUploadingAttachment: attachments.some((attachment) => attachment.status === 'uploading'),
    hasFailedAttachment: attachments.some((attachment) => attachment.status === 'error'),
    completedSessionIds: attachments
      .filter((attachment) => attachment.status === 'done')
      .map((attachment) => attachment.sessionId),
  };
};