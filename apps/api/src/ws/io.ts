import { Server } from "socket.io";
import type { Server as HttpServer } from "node:http";
import { createAdapter } from "@socket.io/redis-adapter";
import { createRedis } from "../db/redis";
import { isAllowedOrigin } from "../config/cors";
import { WS_EVENTS } from "@vedaai/shared";

let io: Server | null = null;

export function initIo(httpServer: HttpServer): Server {
  io = new Server(httpServer, {
    cors: { origin: (o, cb) => cb(null, isAllowedOrigin(o)), methods: ["GET", "POST"] },
  });

  // Redis adapter → any api instance can emit to a client's room (multi-instance safe).
  const pub = createRedis();
  const sub = pub.duplicate();
  io.adapter(createAdapter(pub, sub));

  io.on("connection", (socket) => {
    // Client joins the room for the job it cares about.
    socket.on(WS_EVENTS.SUBSCRIBE, (jobId: unknown) => {
      if (typeof jobId === "string" && jobId.length) socket.join(jobId);
    });
  });

  return io;
}

export function getIo(): Server {
  if (!io) throw new Error("socket.io not initialized");
  return io;
}
