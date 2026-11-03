import {
  MANUAL_RECONNECT_BASE_DELAY_MS,
  MANUAL_RECONNECT_MAX_ATTEMPTS,
  MANUAL_RECONNECTABLE_REASONS,
} from './socket.constant';
import { socketState } from './socket.state';

export const scheduleManualReconnect = (socket, disconnectReason) => {
  if (!MANUAL_RECONNECTABLE_REASONS.includes(disconnectReason)) return;
  if (socketState.manualReconnectAttempts >= MANUAL_RECONNECT_MAX_ATTEMPTS) return;

  socketState.manualReconnectAttempts += 1;

  setTimeout(() => {
    const isCurrentSocket = socketState.socket === socket;
    if (isCurrentSocket && socketState.isNetworkOnline && !socket.connected) socket.connect();
  }, MANUAL_RECONNECT_BASE_DELAY_MS * socketState.manualReconnectAttempts);
};