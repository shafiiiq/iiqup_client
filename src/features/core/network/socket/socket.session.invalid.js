import { expireSession } from '@/features/core/network/api/api.session.expired';
import { dispatchSocketEvent } from './socket.listener.registry';
import { terminateSocket } from './socket.teardown';

export const handleSessionInvalid = (payload) => {
  terminateSocket();
  dispatchSocketEvent('session_invalid', payload);
  expireSession();
};