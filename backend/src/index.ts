import { serve } from "@hono/node-server";
import app from "./app.js";
import { env } from "./lib/env.js";

const server = serve(
  {
    fetch: app.fetch,
    port: env.PORT,
  },
  (info) => {
    console.log(`🩶 OnlyPain API running on http://localhost:${info.port}`);
  }
);

export { server };
