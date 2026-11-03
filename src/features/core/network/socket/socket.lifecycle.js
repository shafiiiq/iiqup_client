import { dispatchSocketEvent } from './socket.listener.registry';
import { scheduleManualReconnect } from './socket.reconnect';
import { handleSessionInvalid } from './socket.session.invalid';
import { socketState } from './socket.state';

export const bindSocketLifecycle = (socket, credentials) => {
  socket.on('connect', () => {
    socketState.isConnecting = false;
    socket.emit('authenticate', credentials);
  });

  socket.on('authenticated', () => {
    socketState.manualReconnectAttempts = 0;
  });

  socket.on('session_invalid', handleSessionInvalid);

  socket.on('disconnect', (reason) => {
    dispatchSocketEvent('disconnect', { reason });
    scheduleManualReconnect(socket, reason);
  });

  socket.on('connect_error', () => {
    socketState.isConnecting = false;
  });
};