// A room is a place where everyone can see each other's presence. It will show who is there, their cursor position,
// and more if I add more features.
//
// A single room that handles multiple connections. This is not a Durable Object but may be used by one. This allows
// one room to be handled by a Durable Object or many rooms to be handled by a single Durable Object, providing for
// multi-tenancy and cheaper costs. Rooms are meant for 10s of connections at a time, probably not 100s, though it would

import { createId } from './id';

const COLLECTION_PERIOD = 10; // milliseconds of colleting changes before broacasting them at once

// be fun to test the limits.
export function createRoom(onRoomClose: () => void): Room {
  const sockets = new Map<WebSocket, string>();
  const byId = new Map<string, WebSocket>();
  const presences: {[id: string]: Presence} = {};
  let queue: {[id: string]: Partial<Presence> | null} = {};
  let pending: number;

  function connect(socket: WebSocket) {
    socket.accept();
    socket.addEventListener('message', event => onMessage(socket, event.data as string));
    socket.addEventListener('close', () => onClose(socket));
    socket.addEventListener('error', () => onClose(socket));
    socket.send(JSON.stringify(presences));
    const id = createId(4, byId);
    byId.set(id, socket);
    sockets.set(socket, id);
  }

  function queueUpdate(id: string, updates: Partial<Presence> | null) {
    queue[id] = updates === null ? updates : { ...queue[id], ...updates };
    if (!pending) pending = setTimeout(broadcastQueue, COLLECTION_PERIOD);
  }

  function broadcastQueue() {
    pending = 0;
    const ids = new Set(Object.keys(queue));
    if (!ids.size) return;

    // Allow more queued items to be added while we broadcast.
    const currentQueue = queue;
    queue = {};

    const full = JSON.stringify(currentQueue);
    sockets.forEach((id, socket) => {
      try {
        if (currentQueue[id]) {
          if (ids.size > 1) {
            const partial = { ...currentQueue };
            delete partial[id];
            socket.send(JSON.stringify(partial));
          }
        } else {
          socket.send(full);
        }
      } catch (e) {
        onClose(socket);
      }
    });
  }

  function onMessage(socket: WebSocket, message: string) {
    const id = sockets.get(socket);
    if (!id) return onClose(socket);

    if (message === 'refresh') {
      const partial = { ...presences };
      delete partial[id];
      socket.send(JSON.stringify(partial));
    }

    try {
      const updates = JSON.parse(message) as Partial<Presence>;

      // Validate updates
      if (updates.id) delete updates.id;
      Object.entries(updates).forEach(([key, value]) => {
        const type = typeof value;
        if ((allowedFields as any)[key] !== typeof value) {
          throw new Error(`${key} of type ${type} is not acceptable`);
        } else if (typeof value === 'string') {
          if (value.length > 100) throw new Error(`Value for ${key} is too long`);
        } else if (typeof value === 'number') {
          if (isNaN(value)) throw new Error(`Value for ${key} is not a number`);
        }
      });

      presences[id] = { ...(presences[id] || { id }), ...updates };
      queueUpdate(id, updates);
    } catch (err) {
      socket.send(JSON.stringify({ error: (err as Error).message }));
    }
  }

  function onClose(socket: WebSocket) {
    try {
      socket.close();
    } catch (err) {}
    const id = sockets.get(socket);
    if (!id) return;
    byId.delete(id);
    sockets.delete(socket);
    delete presences[id as string];
    if (sockets.size === 0) {
      onRoomClose();
    } else {
      queueUpdate(id, null);
    }
  }

  return { connect };
}

const allowedFields = {
  name: 'string',
  img: 'string',
  x: 'number',
  y: 'number',
};

interface Presence {
  id: string;
  name?: string;
  img?: string;
  x?: number;
  y?: number;
}

export interface Room {
  connect(socket: WebSocket): void;
}
