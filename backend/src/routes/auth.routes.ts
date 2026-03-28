import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import {
  signupSchema,
  loginSchema,
  verifyEmailSchema,
} from "../validators/auth.validator.js";
import * as authController from "../controllers/auth.controller.js";
import { authMiddleware } from "../middleware/auth.js";
import { loginRateLimiter } from "../middleware/rateLimiter.js";
import type { AppVariables } from "../app.js";

const auth = new Hono<{ Variables: AppVariables }>();

auth.post("/signup", zValidator("json", signupSchema), authController.signup);

auth.get(
  "/verify-email",
  zValidator("query", verifyEmailSchema),
  authController.verifyEmail
);

auth.post(
  "/login",
  loginRateLimiter,
  zValidator("json", loginSchema),
  authController.login
);

auth.post("/logout", authMiddleware, authController.logout);

auth.post("/refresh", authController.refreshToken);

auth.get("/me", authMiddleware, authController.me);

export default auth;
