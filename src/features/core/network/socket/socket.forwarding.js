import { FORWARDED_SOCKET_EVENTS } from './socket.events';
import { dispatchSocketEvent } from './socket.listener.registry';

export const bindForwardedSocketEvents = (socket) => {
  Object.entries(FORWARDED_SOCKET_EVENTS).forEach(([serverEventName, dispatchedEventName]) => {
    socket.on(serverEventName, (payload) => dispatchSocketEvent(dispatchedEventName, payload));
  });
};