// Pushes the Prisma schema to the test database so tests run with real indexes.
import { spawnSync } from "node:child_process";

const url = process.env.TEST_DATABASE_URL ?? "mongodb://127.0.0.1:27018/onlypain_test?replicaSet=rs0";
const r = spawnSync("npx", ["prisma", "db", "push", "--skip-generate"], {
  stdio: "inherit",
  shell: true,
  env: { ...process.env, DATABASE_URL: url },
});
process.exit(r.status ?? 1);
