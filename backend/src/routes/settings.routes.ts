import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import {
  updateProfileSchema,
  changePasswordSchema,
  deleteAccountSchema,
} from "../validators/settings.validator.js";
import * as settingsController from "../controllers/settings.controller.js";
import { authMiddleware } from "../middleware/auth.js";
import type { AppVariables } from "../app.js";

const settings = new Hono<{ Variables: AppVariables }>();

settings.patch(
  "/profile",
  authMiddleware,
  zValidator("json", updateProfileSchema),
  settingsController.updateProfile
);

settings.patch(
  "/password",
  authMiddleware,
  zValidator("json", changePasswordSchema),
  settingsController.changePassword
);

settings.delete(
  "/account",
  authMiddleware,
  zValidator("json", deleteAccountSchema),
  settingsController.deleteAccount
);

export default settings;
