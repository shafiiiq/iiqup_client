import { useState, useEffect } from 'react';
import { fetchAttachmentUrl } from '../report/api/maintenance.api';

export const useAttachmentUrl = (attachment) => {
  const [remoteUrl, setRemoteUrl] = useState('');

  useEffect(() => {
    if (attachment.previewUrl || !attachment.s3Key) return undefined;
    let isCancelled = false;

    fetchAttachmentUrl(attachment.s3Key)
      .then((url) => { if (!isCancelled) setRemoteUrl(url); })
      .catch(() => {});

    return () => { isCancelled = true; };
  }, [attachment.previewUrl, attachment.s3Key]);

  return attachment.previewUrl || remoteUrl;
};