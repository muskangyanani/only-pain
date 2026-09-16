import pino from "pino";
import { env, isProd, isTest } from "./env.js";

export const logger = pino({
  level: env.LOG_LEVEL || (isTest ? "silent" : isProd ? "info" : "debug"),
  ...(isProd
    ? {}
    : {
        transport: {
          target: "pino-pretty",
          options: { colorize: true, translateTime: "HH:MM:ss", ignore: "pid,hostname" },
        },
      }),
});
