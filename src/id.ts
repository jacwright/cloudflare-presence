const chars = ('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz').split('');

const EMPTY = new Set<string>();


export function uuid(length = 24) {
  let id = '';
  while (length--) {
    id += chars[Math.random() * chars.length | 0];
  }
  return id;
}

export function createId(length = 24, avoid: Map<string, WebSocket> | Set<string> = EMPTY): string {
  let id;
  while (avoid.has(id = uuid(length)));
  return id;
}
