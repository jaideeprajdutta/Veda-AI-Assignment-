import { Redis, type RedisOptions } from "ioredis";
import { env } from "../config/env";

/**
 * BullMQ requires `maxRetriesPerRequest: null` and `enableReadyCheck: false`
 * on its connections. We expose a factory so the queue, worker, QueueEvents,
 * and the socket.io adapter each get their own client (BullMQ blocks clients).
 */
export function createRedis(opts: RedisOptions = {}): Redis {
  return new Redis(env.redisUrl, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    ...opts,
  });
}

/** Shared client for plain cache reads/writes (job state). */
export const cacheRedis: Redis = createRedis();
