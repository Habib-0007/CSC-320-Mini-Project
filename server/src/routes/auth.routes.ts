import express from "express";
import { validate, authSchemas } from "../utils/validation";
import {
  forgotPassword,
  githubAuth,
  githubCallback,
  googleAuth,
  googleCallback,
  login,
  logout,
  refreshToken,
  register,
  resetPassword,
} from "../controllers/auth.controller";
import { authenticateToken } from "../middleware/auth";

const router = express.Router();

// Public routes
router.post("/register", validate(authSchemas.register), register);
router.post("/login", validate(authSchemas.login), login);
router.post(
  "/forgot-password",
  validate(authSchemas.forgotPassword),
  forgotPassword
);
router.post(
  "/reset-password",
  validate(authSchemas.resetPassword),
  resetPassword
);
router.post("/refresh-token", refreshToken);

// OAuth routes
router.get("/github", githubAuth);
router.get("/github/callback", githubCallback);
router.get("/google", googleAuth);
router.get("/google/callback", googleCallback);

// Protected routes
router.post("/logout", authenticateToken as any, logout);

export default router;
