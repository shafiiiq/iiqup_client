import { useEffect, useState } from 'react';
import { resolveAttachmentUrl } from '../services/notification.attachment.service';

export const useAttachmentUrl = (filePath) => {
  const [attachmentUrl, setAttachmentUrl] = useState(null);

  useEffect(() => {
    if (!filePath) {
      setAttachmentUrl(null);
      return undefined;
    }
    let isCancelled = false;
    resolveAttachmentUrl(filePath)
      .then((resolvedUrl) => {
        if (!isCancelled) setAttachmentUrl(resolvedUrl);
      })
      .catch(() => {
        if (!isCancelled) setAttachmentUrl(null);
      });
    return () => {
      isCancelled = true;
    };
  }, [filePath]);

  return attachmentUrl;
};