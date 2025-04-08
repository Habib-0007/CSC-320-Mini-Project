import express from "express";
import { validate, userSchemas } from "../utils/validation";
import {
  changePassword,
  createApiKey,
  deleteApiKey,
  getApiKeys,
  getCurrentUser,
  getUserUsage,
  updateProfile,
} from "../controllers/user.controller";

const router = express.Router();

// Get current user profile
router.get("/me", getCurrentUser);

// Update user profile
router.put(
  "/me",
  validate(userSchemas.updateProfile),
  updateProfile
);

// Change password
router.put(
  "/change-password",
  validate(userSchemas.changePassword),
  changePassword
);

// Usage statistics
router.get("/usage", getUserUsage);

// API key management
router.get("/api-keys", getApiKeys);
router.post("/api-keys", createApiKey);
router.delete("/api-keys/:id", deleteApiKey);

export default router;
