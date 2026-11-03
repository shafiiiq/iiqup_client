import io from 'socket.io-client';
import {
    SOCKET_RECONNECT_ATTEMPTS,
    SOCKET_RECONNECT_DELAY_MS,
    SOCKET_TIMEOUT_MS,
} from './socket.constant';
import { readSocketCredentials } from './socket.credentials';
import { bindForwardedSocketEvents } from './socket.forwarding';
import { bindSocketLifecycle } from './socket.lifecycle';
import { socketState } from './socket.state';
import { terminateSocket } from './socket.teardown';
import { SOCKET_ORIGIN } from './socket.url';
import { isPdfRenderMode } from '@/features/core/sync/pdf/helper/document.pdf.helper';

const SOCKET_OPTIONS = {
    transports: ['websocket'],
    reconnection: true,
    reconnectionDelay: SOCKET_RECONNECT_DELAY_MS,
    reconnectionAttempts: SOCKET_RECONNECT_ATTEMPTS,
    timeout: SOCKET_TIMEOUT_MS,
};

export const connectSocket = () => {
    if (isPdfRenderMode()) return;
    if (socketState.socket?.connected || socketState.isConnecting) return;
    if (!socketState.isNetworkOnline) return;

    const credentials = readSocketCredentials();
    if (!credentials) return;

    terminateSocket();
    socketState.isConnecting = true;

    const socket = io(SOCKET_ORIGIN, SOCKET_OPTIONS);
    socketState.socket = socket;

    bindSocketLifecycle(socket, credentials);
    bindForwardedSocketEvents(socket);
};

export const restoreSocketConnection = () => {
    if (socketState.socket?.connected) return;
    terminateSocket();
    connectSocket();
};

export const emitSocketEvent = (eventName, payload) => {
    if (!socketState.socket?.connected) return false;
    socketState.socket.emit(eventName, payload);
    return true;
};