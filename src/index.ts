import INDEX from './index.html';
import ROOM from './room.html';

export default {
  async fetch(req: Request, env: EnvInterface): Promise<Response> {

    if (req.headers.get('Upgrade') === 'websocket') {
      // For this implementation, I am using a single Durable Object to handle all rooms. This is not a good idea, but
      // for demo purposes it is fine. A multitenant coordinator might work great, putting multiple rooms on each Durable
      // Object or a single room on each Durable Object.
      const id = env.PRESENCE.idFromName('DEMO');
      const obj = env.PRESENCE.get(id);
      return await obj.fetch(req);
    } else if (req.method === 'GET') {
      const url = new URL(req.url);
      if (url.pathname === '/') {
        return new Response(INDEX, {headers: {"Content-Type": "text/html;charset=UTF-8"}});
      } else if (url.pathname === '/room.html') {
        return new Response(ROOM, {headers: {"Content-Type": "text/html;charset=UTF-8"}});
      }
    }

    return new Response(null, {status: 404});
  },
};


export { presence } from './presence';

export interface EnvInterface {
  PRESENCE: DurableObjectNamespace
}
