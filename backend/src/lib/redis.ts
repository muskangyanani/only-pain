import { Redis } from "ioredis";
import { env } from "./env.js";
import { logger } from "./logger.js";

let client: Redis | null | undefined;

/** Lazily-created shared Redis client, or null when REDIS_URL is not set. */
export function getRedis(): Redis | null {
  if (client !== undefined) return client;
  if (!env.REDIS_URL) {
    client = null;
    return client;
  }
  client = new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: 2,
    enableOfflineQueue: false,
    lazyConnect: true,
  });
  client.on("error", (err) => logger.warn({ err }, "redis error"));
  client.connect().catch((err) => logger.warn({ err }, "redis connect failed"));
  return client;
}
