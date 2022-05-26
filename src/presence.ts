import { createRoom, Room } from './room';

// Durable Objects are class-based objects, but they can be created with function syntax for functional programming.
// This is the same as:
//
// export class presence {
//   constructor() {}
//   fetch(req: Request) {...}
// }
export function presence() {
  // TODO create a multitenant Durable Object to coordinate so that multiple rooms up to a limit can be handled by a
  // single Durable Object. Without it, we have the option of having one room per Durable Object, or all on one. Here
  // we are putting all on one.
  const rooms = new Map<string, Room>();

  function fetch(req: Request) {
    if (req.headers.get('Upgrade') !== 'websocket') {
      return new Response('{"error":"Expected websocket"}', {status: 400, headers: {'Content-Type': 'application/json'}});
    }

    const url = new URL(req.url);
    const name = url.searchParams.get('room');
    if (!name) {
      return new Response('{"error":"Requires room name in query params (e.g. ?room=foo)"}', {status: 400, headers: {'Content-Type': 'application/json'}});
    }

    const [ webSocket, internal ] = Object.values(new WebSocketPair());

    let room = rooms.get(name);
    if (!room) {
      room = createRoom(() => rooms.delete(name));
      rooms.set(name, room);
    }
    room.connect(internal);

    return new Response(null, { status: 101, webSocket });
  }

  // Return the API for this Durable Object, which is really just fetch since no other methods can be called on it
  // from the outside.
  return { fetch };
}
