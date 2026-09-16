// Runs before every test file (see vitest.config.ts).
process.env.NODE_ENV = "test";
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL ?? "mongodb://127.0.0.1:27018/onlypain_test?replicaSet=rs0";
process.env.JWT_SECRET = "test-secret-test-secret-test-secret";
process.env.JWT_REFRESH_SECRET = "test-refresh-secret-test-refresh-secret";
process.env.CLIENT_URL = "http://localhost:3000";
process.env.RATE_LIMIT_DISABLED = "1";
process.env.AI_SAFETY_MODE = "keywords";
process.env.ANTHROPIC_API_KEY = "";
process.env.REDIS_URL = "";
process.env.RESEND_API_KEY = "";
process.env.STRIPE_SECRET_KEY = "";
process.env.LOG_LEVEL = "silent";
