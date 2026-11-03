import { socketState } from './socket.state';

export const terminateSocket = () => {
  if (socketState.socket) {
    socketState.socket.removeAllListeners();
    socketState.socket.disconnect();
  }
  socketState.socket = null;
  socketState.isConnecting = false;
  socketState.manualReconnectAttempts = 0;
};