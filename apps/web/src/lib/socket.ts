import { io, type Socket } from "socket.io-client";

const WS = process.env.NEXT_PUBLIC_WS_URL ?? "http://localhost:4000";

let socket: Socket | null = null;

/**
 * Lazily create a single shared socket connection.
 * Uses polling→websocket upgrade (socket.io default) for max compatibility —
 * a hard websocket-only transport fails silently in some environments.
 */
export function getSocket(): Socket {
  if (!socket) {
    socket = io(WS, { transports: ["polling", "websocket"], autoConnect: true });
  }
  return socket;
}
