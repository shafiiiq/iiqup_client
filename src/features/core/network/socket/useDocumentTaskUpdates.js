import { useEffect, useRef } from 'react';
import socketService from '@/features/core/network/socket/socket.service';

const useDocumentTaskUpdates = (onUpdate, sourceKey) => {
  const onUpdateRef = useRef(onUpdate);
  onUpdateRef.current = onUpdate;

  useEffect(
    () =>
      socketService.on('document_task_update', (payload) => {
        if (!sourceKey || payload?.sourceKey === sourceKey) onUpdateRef.current(payload);
      }),
    [sourceKey]
  );
};

export default useDocumentTaskUpdates;