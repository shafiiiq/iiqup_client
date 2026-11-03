import { useEffect } from 'react';
import WebSocketService from '@/features/core/network/socket/socket.service';

export const useDashboardRealtime = (onUpdate) => {
  useEffect(() => {
    const unsubscribe = WebSocketService.on('dashboard_update', onUpdate);
    return unsubscribe;
  }, [onUpdate]);
};
