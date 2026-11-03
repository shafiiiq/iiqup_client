import { connectSocket, emitSocketEvent, restoreSocketConnection } from './socket.connection';
import { addSocketListener, removeSocketListener } from './socket.listener.registry';
import { socketState } from './socket.state';
import { startNetworkMonitoring, stopNetworkMonitoring } from './socket.network.monitor';
import { terminateSocket } from './socket.teardown';
import { startVisibilityMonitoring, stopVisibilityMonitoring } from './socket.visibility.monitor';

const socketService = {
  connect() {
    startNetworkMonitoring(restoreSocketConnection);
    startVisibilityMonitoring(restoreSocketConnection);
    connectSocket();
  },

  disconnect() {
    stopNetworkMonitoring();
    stopVisibilityMonitoring();
    terminateSocket();
  },

  emit: emitSocketEvent,

  on: addSocketListener,

  off: removeSocketListener,

  get isConnected() {
    return Boolean(socketState.socket?.connected);
  },
};

export default socketService;