import type { Server as HttpServer } from "node:http";
import { serve } from "@hono/node-server";
import app from "./app.js";
import { env } from "./lib/env.js";
import { logger } from "./lib/logger.js";
import { prisma } from "./lib/prisma.js";
import { initSocket } from "./socket/index.js";
import { aiLive } from "./ai/client.js";
import { billingEnabled } from "./services/billing.service.js";

const server = serve({ fetch: app.fetch, port: env.PORT, hostname: "0.0.0.0" }, (info) => {
  logger.info(
    { port: info.port, ai: aiLive() ? "live" : "mock", billing: billingEnabled ? "enabled" : "disabled", redis: env.REDIS_URL ? "on" : "off" },
    "🫂 only pain api ready"
  );
});

initSocket(server as HttpServer);

async function shutdown(signal: string) {
  logger.info({ signal }, "shutting down");
  server.close();
  await prisma.$disconnect().catch(() => {});
  process.exit(0);
}
process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("SIGINT", () => void shutdown("SIGINT"));

export { server };
